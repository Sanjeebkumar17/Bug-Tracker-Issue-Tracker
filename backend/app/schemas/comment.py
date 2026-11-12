from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.schemas.user import UserResponse

class CommentBase(BaseModel):
    content: str
    parent_id: Optional[int] = None

class CommentCreate(CommentBase):
    pass

class CommentUpdate(BaseModel):
    content: str

class CommentResponse(BaseModel):
    id: int
    ticket_id: int
    author_id: int
    parent_id: Optional[int] = None
    content: str
    created_at: datetime
    updated_at: datetime
    author: UserResponse
    replies: List["CommentResponse"] = []

    model_config = ConfigDict(from_attributes=True)
