import re
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from app.db.session import get_db
from app.core.deps import get_current_user, get_project_role
from app.models.user import User
from app.models.project import Project, ProjectMember
from app.models.ticket import Ticket
from app.models.comment import Comment
from app.models.attachment import Attachment
from app.models.tag import Tag
from app.models.activity import ActivityLog
from app.models.worklog import WorkLog
from app.models.notification import Notification
from app.schemas.ticket import (
    TicketCreate, TicketUpdate, TicketStatusUpdate,
    TicketResponse, TicketDetailResponse
)
from app.schemas.activity import ActivityLogResponse
from app.schemas.worklog import WorkLogCreate, WorkLogResponse
from app.services.websocket_manager import ws_manager

router = APIRouter()

def enrich_ticket(t: Ticket, db: Session) -> dict:
    comments_count = db.query(func.count(Comment.id)).filter(Comment.ticket_id == t.id).scalar() or 0
    attachments_count = db.query(func.count(Attachment.id)).filter(Attachment.ticket_id == t.id).scalar() or 0
    total_logged = db.query(func.sum(WorkLog.time_spent_minutes)).filter(WorkLog.ticket_id == t.id).scalar() or 0
    
    return {
        "id": t.id,
        "ticket_number": t.ticket_number,
        "key": t.key,
        "title": t.title,
        "description": t.description,
        "type": t.type,
        "priority": t.priority,
        "status": t.status,
        "project_id": t.project_id,
        "reporter_id": t.reporter_id,
        "assignee_id": t.assignee_id,
        "sprint_id": t.sprint_id,
        "story_points": t.story_points,
        "estimated_hours": t.estimated_hours,
        "order_index": t.order_index,
        "created_at": t.created_at,
        "updated_at": t.updated_at,
        "reporter": t.reporter,
        "assignee": t.assignee,
        "sprint": t.sprint,
        "tags": t.tags or [],
        "comments_count": comments_count,
        "attachments_count": attachments_count,
        "total_logged_minutes": int(total_logged)
    }

def process_mentions(text: str, ticket: Ticket, current_user: User, db: Session):
    if not text:
        return
    # Find all @username mentions
    usernames = set(re.findall(r'@([a-zA-Z0-9_]+)', text))
    for uname in usernames:
        mentioned_user = db.query(User).filter(User.username == uname).first()
        if mentioned_user and mentioned_user.id != current_user.id:
            notif = Notification(
                user_id=mentioned_user.id,
                ticket_id=ticket.id,
                title=f"Mentioned by {current_user.full_name}",
                message=f"{current_user.full_name} mentioned you in issue {ticket.key}: {ticket.title[:60]}",
                type="mention"
            )
            db.add(notif)
    db.commit()

@router.get("", response_model=List[TicketResponse])
def get_tickets(
    project_id: Optional[int] = Query(None),
    sprint_id: Optional[str] = Query(None, description="sprint id or 'backlog'"),
    tag_id: Optional[int] = Query(None),
    search: Optional[str] = Query(None, description="Search in title, description, or key"),
    status_filter: Optional[str] = Query(None, alias="status"),
    priority_filter: Optional[str] = Query(None, alias="priority"),
    type_filter: Optional[str] = Query(None, alias="type"),
    assignee_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Ticket)

    if project_id:
        role = get_project_role(project_id, current_user, db)
        if not role:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to this project")
        query = query.filter(Ticket.project_id == project_id)
    else:
        if current_user.role != "admin":
            member_project_ids = db.query(ProjectMember.project_id).filter(ProjectMember.user_id == current_user.id).subquery()
            owned_project_ids = db.query(Project.id).filter(Project.owner_id == current_user.id).subquery()
            query = query.filter(
                (Ticket.project_id.in_(member_project_ids)) | 
                (Ticket.project_id.in_(owned_project_ids))
            )

    if sprint_id is not None:
        if sprint_id.lower() == "backlog" or sprint_id == "0":
            query = query.filter(Ticket.sprint_id.is_(None))
        else:
            try:
                sid = int(sprint_id)
                query = query.filter(Ticket.sprint_id == sid)
            except ValueError:
                pass

    if tag_id:
        query = query.filter(Ticket.tags.any(Tag.id == tag_id))

    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (Ticket.title.ilike(search_term)) |
            (Ticket.description.ilike(search_term)) |
            (Ticket.key.ilike(search_term))
        )

    if status_filter:
        query = query.filter(Ticket.status == status_filter)
    if priority_filter:
        query = query.filter(Ticket.priority == priority_filter)
    if type_filter:
        query = query.filter(Ticket.type == type_filter)
    if assignee_id:
        query = query.filter(Ticket.assignee_id == assignee_id)

    tickets = query.order_by(Ticket.order_index.asc(), Ticket.id.desc()).all()
    return [enrich_ticket(t, db) for t in tickets]

@router.post("", response_model=TicketResponse, status_code=status.HTTP_201_CREATED)
async def create_ticket(
    ticket_in: TicketCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = db.query(Project).filter(Project.id == ticket_in.project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    role = get_project_role(ticket_in.project_id, current_user, db)
    if not role or role == "viewer":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Viewers cannot create tickets")

    last_ticket = db.query(Ticket).filter(Ticket.project_id == project.id).order_by(desc(Ticket.ticket_number)).first()
    next_number = (last_ticket.ticket_number + 1) if last_ticket else 1
    ticket_key = f"{project.key}-{next_number}"

    last_in_status = db.query(Ticket).filter(
        Ticket.project_id == project.id,
        Ticket.status == ticket_in.status
    ).order_by(desc(Ticket.order_index)).first()
    order_index = (last_in_status.order_index + 1000.0) if last_in_status else 1000.0

    ticket = Ticket(
        ticket_number=next_number,
        key=ticket_key,
        title=ticket_in.title,
        description=ticket_in.description,
        type=ticket_in.type,
        priority=ticket_in.priority,
        status=ticket_in.status,
        project_id=ticket_in.project_id,
        reporter_id=current_user.id,
        assignee_id=ticket_in.assignee_id,
        sprint_id=ticket_in.sprint_id,
        story_points=ticket_in.story_points,
        estimated_hours=ticket_in.estimated_hours,
        order_index=order_index
    )

    if ticket_in.tag_ids:
        tags = db.query(Tag).filter(Tag.id.in_(ticket_in.tag_ids), Tag.project_id == ticket_in.project_id).all()
        ticket.tags = tags

    db.add(ticket)
    db.commit()
    db.refresh(ticket)

    # Activity log for creation
    activity = ActivityLog(
        ticket_id=ticket.id,
        user_id=current_user.id,
        action="created",
        new_value=ticket.title
    )
    db.add(activity)

    # Notification for assignment if assigned on creation
    if ticket.assignee_id and ticket.assignee_id != current_user.id:
        notif = Notification(
            user_id=ticket.assignee_id,
            ticket_id=ticket.id,
            title=f"New issue assigned: {ticket.key}",
            message=f"{current_user.full_name} assigned you issue {ticket.key}: {ticket.title}",
            type="assignment"
        )
        db.add(notif)
    db.commit()

    # Process any @mentions in description
    if ticket.description:
        process_mentions(ticket.description, ticket, current_user, db)

    enriched = enrich_ticket(ticket, db)
    await ws_manager.broadcast(ticket.project_id, {
        "event": "ticket_created",
        "data": {
            "id": ticket.id,
            "key": ticket.key,
            "title": ticket.title,
            "status": ticket.status,
            "project_id": ticket.project_id
        }
    })

    return enriched

@router.get("/{ticket_id}", response_model=TicketDetailResponse)
def get_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")

    role = get_project_role(ticket.project_id, current_user, db)
    if not role:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    enriched = enrich_ticket(ticket, db)
    all_comments = ticket.comments
    top_level = [c for c in all_comments if c.parent_id is None]
    
    enriched["comments"] = top_level
    enriched["attachments"] = ticket.attachments
    enriched["activities"] = ticket.activities
    enriched["worklogs"] = ticket.worklogs
    return enriched

@router.put("/{ticket_id}", response_model=TicketResponse)
async def update_ticket(
    ticket_id: int,
    ticket_in: TicketUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")

    role = get_project_role(ticket.project_id, current_user, db)
    if not role or role == "viewer":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Viewers cannot edit tickets")

    # Track activity log changes
    if ticket_in.title is not None and ticket_in.title != ticket.title:
        db.add(ActivityLog(ticket_id=ticket.id, user_id=current_user.id, action="title_changed", old_value=ticket.title, new_value=ticket_in.title))
        ticket.title = ticket_in.title

    if ticket_in.description is not None and ticket_in.description != ticket.description:
        ticket.description = ticket_in.description
        process_mentions(ticket_in.description, ticket, current_user, db)

    if ticket_in.type is not None and ticket_in.type != ticket.type:
        db.add(ActivityLog(ticket_id=ticket.id, user_id=current_user.id, action="type_changed", old_value=ticket.type, new_value=ticket_in.type))
        ticket.type = ticket_in.type

    if ticket_in.priority is not None and ticket_in.priority != ticket.priority:
        db.add(ActivityLog(ticket_id=ticket.id, user_id=current_user.id, action="priority_changed", old_value=ticket.priority, new_value=ticket_in.priority))
        ticket.priority = ticket_in.priority

    if ticket_in.status is not None and ticket_in.status != ticket.status:
        db.add(ActivityLog(ticket_id=ticket.id, user_id=current_user.id, action="status_changed", old_value=ticket.status, new_value=ticket_in.status))
        ticket.status = ticket_in.status

    if ticket_in.assignee_id is not None:
        new_assignee_id = None if ticket_in.assignee_id == -1 else ticket_in.assignee_id
        if new_assignee_id != ticket.assignee_id:
            old_name = ticket.assignee.full_name if ticket.assignee else "Unassigned"
            new_user = db.query(User).filter(User.id == new_assignee_id).first() if new_assignee_id else None
            new_name = new_user.full_name if new_user else "Unassigned"
            db.add(ActivityLog(ticket_id=ticket.id, user_id=current_user.id, action="assignee_changed", old_value=old_name, new_value=new_name))
            ticket.assignee_id = new_assignee_id
            
            if new_user and new_user.id != current_user.id:
                db.add(Notification(
                    user_id=new_user.id,
                    ticket_id=ticket.id,
                    title=f"Assigned to {ticket.key}",
                    message=f"{current_user.full_name} assigned you to {ticket.key}: {ticket.title}",
                    type="assignment"
                ))

    if ticket_in.sprint_id is not None:
        new_sid = None if ticket_in.sprint_id == -1 else ticket_in.sprint_id
        if new_sid != ticket.sprint_id:
            ticket.sprint_id = new_sid

    if ticket_in.story_points is not None:
        ticket.story_points = None if ticket_in.story_points == -1 else ticket_in.story_points

    if ticket_in.estimated_hours is not None:
        ticket.estimated_hours = None if ticket_in.estimated_hours < 0 else ticket_in.estimated_hours

    if ticket_in.order_index is not None:
        ticket.order_index = ticket_in.order_index

    if ticket_in.tag_ids is not None:
        tags = db.query(Tag).filter(Tag.id.in_(ticket_in.tag_ids), Tag.project_id == ticket.project_id).all()
        ticket.tags = tags

    db.commit()
    db.refresh(ticket)

    enriched = enrich_ticket(ticket, db)
    await ws_manager.broadcast(ticket.project_id, {
        "event": "ticket_updated",
        "data": {
            "id": ticket.id,
            "key": ticket.key,
            "status": ticket.status,
            "title": ticket.title,
            "project_id": ticket.project_id
        }
    })
    return enriched

@router.patch("/{ticket_id}/status", response_model=TicketResponse)
async def update_ticket_status(
    ticket_id: int,
    status_update: TicketStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")

    role = get_project_role(ticket.project_id, current_user, db)
    if not role or role == "viewer":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Viewers cannot modify ticket status")

    old_status = ticket.status
    ticket.status = status_update.status
    if status_update.order_index is not None:
        ticket.order_index = status_update.order_index

    if old_status != status_update.status:
        db.add(ActivityLog(
            ticket_id=ticket.id,
            user_id=current_user.id,
            action="status_changed",
            old_value=old_status,
            new_value=status_update.status
        ))

    db.commit()
    db.refresh(ticket)

    enriched = enrich_ticket(ticket, db)
    await ws_manager.broadcast(ticket.project_id, {
        "event": "ticket_status_changed",
        "data": {
            "id": ticket.id,
            "key": ticket.key,
            "status": ticket.status,
            "order_index": ticket.order_index,
            "project_id": ticket.project_id
        }
    })
    return enriched

@router.delete("/{ticket_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")

    role = get_project_role(ticket.project_id, current_user, db)
    if role != "admin" and ticket.reporter_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only admins or the ticket reporter can delete this ticket")

    project_id = ticket.project_id
    ticket_key = ticket.key

    db.delete(ticket)
    db.commit()

    await ws_manager.broadcast(project_id, {
        "event": "ticket_deleted",
        "data": {"id": ticket_id, "key": ticket_key, "project_id": project_id}
    })
    return None

# WorkLog Endpoints
@router.post("/{ticket_id}/worklogs", response_model=WorkLogResponse, status_code=status.HTTP_201_CREATED)
async def log_work(
    ticket_id: int,
    worklog_in: WorkLogCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")

    role = get_project_role(ticket.project_id, current_user, db)
    if not role or role == "viewer":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Viewers cannot log work")

    worklog = WorkLog(
        ticket_id=ticket_id,
        user_id=current_user.id,
        time_spent_minutes=worklog_in.time_spent_minutes,
        description=worklog_in.description
    )
    db.add(worklog)

    db.add(ActivityLog(
        ticket_id=ticket.id,
        user_id=current_user.id,
        action="work_logged",
        new_value=f"{worklog_in.time_spent_minutes} minutes"
    ))

    db.commit()
    db.refresh(worklog)
    return worklog

@router.get("/{ticket_id}/activities", response_model=List[ActivityLogResponse])
def get_ticket_activities(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")
    return ticket.activities
