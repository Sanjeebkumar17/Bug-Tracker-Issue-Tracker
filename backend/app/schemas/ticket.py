from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from app.schemas.user import UserResponse
from app.schemas.comment import CommentResponse
from app.schemas.attachment import AttachmentResponse
from app.schemas.tag import TagResponse
from app.schemas.sprint import SprintResponse
from app.schemas.activity import ActivityLogResponse
from app.schemas.worklog import WorkLogResponse

class TicketBase(BaseModel):
    title: str = Field(..., min_length=2, max_length=200)
    description: Optional[str] = None
    type: str = Field(default="bug", description="bug, task, feature")
    priority: str = Field(default="medium", description="low, medium, high, urgent")
    status: str = Field(default="todo", description="todo, in_progress, in_review, done")
    assignee_id: Optional[int] = None
    sprint_id: Optional[int] = None
    story_points: Optional[int] = None
    estimated_hours: Optional[float] = None

class TicketCreate(TicketBase):
    project_id: int
    tag_ids: Optional[List[int]] = []

class TicketUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=2, max_length=200)
    description: Optional[str] = None
    type: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    assignee_id: Optional[int] = None
    sprint_id: Optional[int] = None
    story_points: Optional[int] = None
    estimated_hours: Optional[float] = None
    order_index: Optional[float] = None
    tag_ids: Optional[List[int]] = None

class TicketStatusUpdate(BaseModel):
    status: str
    order_index: Optional[float] = None

class TicketResponse(TicketBase):
    id: int
    ticket_number: int
    key: str
    project_id: int
    reporter_id: int
    order_index: float
    created_at: datetime
    updated_at: datetime
    
    reporter: UserResponse
    assignee: Optional[UserResponse] = None
    sprint: Optional[SprintResponse] = None
    tags: List[TagResponse] = []
    comments_count: Optional[int] = 0
    attachments_count: Optional[int] = 0
    total_logged_minutes: Optional[int] = 0

    model_config = ConfigDict(from_attributes=True)

class TicketDetailResponse(TicketResponse):
    comments: List[CommentResponse] = []
    attachments: List[AttachmentResponse] = []
    activities: List[ActivityLogResponse] = []
    worklogs: List[WorkLogResponse] = []

    model_config = ConfigDict(from_attributes=True)
