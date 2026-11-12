from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.deps import get_current_user, get_current_admin
from app.models.user import User
from app.schemas.user import UserResponse

router = APIRouter()

@router.get("", response_model=List[UserResponse])
def get_users(
    search: Optional[str] = Query(None, description="Search by username, full name, or email"),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(User).filter(User.is_active == True)
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (User.username.ilike(search_pattern)) |
            (User.full_name.ilike(search_pattern)) |
            (User.email.ilike(search_pattern))
        )
    return query.offset(skip).limit(limit).all()

@router.get("/{user_id}", response_model=UserResponse)
def get_user_by_id(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user

@router.put("/{user_id}/role", response_model=UserResponse)
def update_user_system_role(
    user_id: int,
    role: str = Query(..., pattern="^(admin|developer|viewer)$"),
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    user.role = role
    db.commit()
    db.refresh(user)
    return user
