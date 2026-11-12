from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.session import get_db
from app.core.deps import get_current_user, get_project_role
from app.models.user import User
from app.models.project import Project
from app.models.sprint import Sprint
from app.models.ticket import Ticket
from app.schemas.sprint import SprintCreate, SprintUpdate, SprintResponse
from app.services.websocket_manager import ws_manager

router = APIRouter()

def enrich_sprint(s: Sprint, db: Session) -> dict:
    tickets_count = db.query(func.count(Ticket.id)).filter(Ticket.sprint_id == s.id).scalar() or 0
    total_sp = db.query(func.sum(Ticket.story_points)).filter(Ticket.sprint_id == s.id).scalar() or 0
    return {
        "id": s.id,
        "project_id": s.project_id,
        "name": s.name,
        "goal": s.goal,
        "status": s.status,
        "start_date": s.start_date,
        "end_date": s.end_date,
        "created_at": s.created_at,
        "updated_at": s.updated_at,
        "tickets_count": tickets_count,
        "total_story_points": int(total_sp) if total_sp else 0
    }

@router.get("/projects/{project_id}/sprints", response_model=List[SprintResponse])
def get_project_sprints(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    role = get_project_role(project_id, current_user, db)
    if not role:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    sprints = db.query(Sprint).filter(Sprint.project_id == project_id).order_by(Sprint.created_at.desc()).all()
    return [enrich_sprint(s, db) for s in sprints]

@router.post("/projects/{project_id}/sprints", response_model=SprintResponse, status_code=status.HTTP_201_CREATED)
async def create_sprint(
    project_id: int,
    sprint_in: SprintCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    role = get_project_role(project_id, current_user, db)
    if not role or role == "viewer":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Viewers cannot create sprints")

    sprint = Sprint(
        project_id=project_id,
        name=sprint_in.name,
        goal=sprint_in.goal,
        status=sprint_in.status or "future",
        start_date=sprint_in.start_date,
        end_date=sprint_in.end_date
    )
    db.add(sprint)
    db.commit()
    db.refresh(sprint)

    await ws_manager.broadcast(project_id, {
        "event": "sprint_created",
        "data": {"id": sprint.id, "name": sprint.name, "project_id": project_id}
    })

    return enrich_sprint(sprint, db)

@router.put("/sprints/{sprint_id}", response_model=SprintResponse)
async def update_sprint(
    sprint_id: int,
    sprint_in: SprintUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sprint = db.query(Sprint).filter(Sprint.id == sprint_id).first()
    if not sprint:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sprint not found")

    role = get_project_role(sprint.project_id, current_user, db)
    if not role or role == "viewer":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Viewers cannot modify sprints")

    # If starting sprint (setting status to active), optionally ensure only one sprint is active at a time
    if sprint_in.status == "active":
        # Mark other active sprints in the project as completed or leave open
        pass

    if sprint_in.name is not None:
        sprint.name = sprint_in.name
    if sprint_in.goal is not None:
        sprint.goal = sprint_in.goal
    if sprint_in.status is not None:
        sprint.status = sprint_in.status
    if sprint_in.start_date is not None:
        sprint.start_date = sprint_in.start_date
    if sprint_in.end_date is not None:
        sprint.end_date = sprint_in.end_date

    db.commit()
    db.refresh(sprint)

    await ws_manager.broadcast(sprint.project_id, {
        "event": "sprint_updated",
        "data": {"id": sprint.id, "status": sprint.status, "project_id": sprint.project_id}
    })

    return enrich_sprint(sprint, db)

@router.delete("/sprints/{sprint_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_sprint(
    sprint_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sprint = db.query(Sprint).filter(Sprint.id == sprint_id).first()
    if not sprint:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sprint not found")

    role = get_project_role(sprint.project_id, current_user, db)
    if role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin role required to delete sprints")

    project_id = sprint.project_id
    # Unlink tickets to backlog
    db.query(Ticket).filter(Ticket.sprint_id == sprint_id).update({"sprint_id": None})
    db.delete(sprint)
    db.commit()

    await ws_manager.broadcast(project_id, {
        "event": "sprint_deleted",
        "data": {"id": sprint_id, "project_id": project_id}
    })
    return None
