from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from app.schemas.user import UserResponse

class WorkLogCreate(BaseModel):
    time_spent_minutes: int = Field(..., gt=0, description="Time spent in minutes")
    description: Optional[str] = None

class WorkLogResponse(BaseModel):
    id: int
    ticket_id: int
    user_id: int
    time_spent_minutes: int
    description: Optional[str] = None
    created_at: datetime
    user: UserResponse

    model_config = ConfigDict(from_attributes=True)
