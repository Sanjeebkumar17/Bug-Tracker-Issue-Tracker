from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.deps import get_current_user, get_project_role
from app.models.user import User
from app.models.tag import Tag
from app.schemas.tag import TagCreate, TagResponse

router = APIRouter()

@router.get("/projects/{project_id}/tags", response_model=List[TagResponse])
def get_project_tags(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    role = get_project_role(project_id, current_user, db)
    if not role:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    return db.query(Tag).filter(Tag.project_id == project_id).all()

@router.post("/projects/{project_id}/tags", response_model=TagResponse, status_code=status.HTTP_201_CREATED)
def create_tag(
    project_id: int,
    tag_in: TagCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    role = get_project_role(project_id, current_user, db)
    if not role or role == "viewer":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Viewers cannot create tags")

    existing = db.query(Tag).filter(Tag.project_id == project_id, Tag.name == tag_in.name.strip()).first()
    if existing:
        return existing

    tag = Tag(
        project_id=project_id,
        name=tag_in.name.strip(),
        color=tag_in.color or "#3b82f6"
    )
    db.add(tag)
    db.commit()
    db.refresh(tag)
    return tag

@router.delete("/tags/{tag_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_tag(
    tag_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    tag = db.query(Tag).filter(Tag.id == tag_id).first()
    if not tag:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tag not found")

    role = get_project_role(tag.project_id, current_user, db)
    if role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin role required")

    db.delete(tag)
    db.commit()
    return None
