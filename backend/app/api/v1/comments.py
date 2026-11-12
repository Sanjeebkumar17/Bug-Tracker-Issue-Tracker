import re
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.deps import get_current_user, get_project_role
from app.models.user import User
from app.models.ticket import Ticket
from app.models.comment import Comment
from app.models.activity import ActivityLog
from app.models.notification import Notification
from app.schemas.comment import CommentCreate, CommentResponse
from app.services.websocket_manager import ws_manager

router = APIRouter()

@router.post("/tickets/{ticket_id}/comments", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
async def create_comment(
    ticket_id: int,
    comment_in: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")

    role = get_project_role(ticket.project_id, current_user, db)
    if not role or role == "viewer":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Viewers cannot post comments")

    if comment_in.parent_id:
        parent = db.query(Comment).filter(
            Comment.id == comment_in.parent_id,
            Comment.ticket_id == ticket_id
        ).first()
        if not parent:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parent comment not found")

    new_comment = Comment(
        ticket_id=ticket_id,
        author_id=current_user.id,
        parent_id=comment_in.parent_id,
        content=comment_in.content
    )
    db.add(new_comment)

    # Activity log for comment
    db.add(ActivityLog(
        ticket_id=ticket_id,
        user_id=current_user.id,
        action="comment_added",
        new_value=comment_in.content[:80]
    ))

    # Process mentions in comment
    usernames = set(re.findall(r'@([a-zA-Z0-9_]+)', comment_in.content))
    for uname in usernames:
        mentioned_user = db.query(User).filter(User.username == uname).first()
        if mentioned_user and mentioned_user.id != current_user.id:
            db.add(Notification(
                user_id=mentioned_user.id,
                ticket_id=ticket.id,
                title=f"Mentioned in comment by {current_user.full_name}",
                message=f"{current_user.full_name} mentioned you in issue {ticket.key}: \"{comment_in.content[:60]}\"",
                type="mention"
            ))

    db.commit()
    db.refresh(new_comment)

    await ws_manager.broadcast(ticket.project_id, {
        "event": "comment_added",
        "data": {
            "ticket_id": ticket_id,
            "comment_id": new_comment.id,
            "author_id": current_user.id
        }
    })

    return new_comment

@router.delete("/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found")

    ticket = comment.ticket
    role = get_project_role(ticket.project_id, current_user, db)

    if current_user.role != "admin" and role != "admin" and comment.author_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot delete this comment")

    db.delete(comment)
    db.commit()
    return None
