from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.schemas.user import UserResponse

class ActivityLogResponse(BaseModel):
    id: int
    ticket_id: int
    user_id: int
    action: str
    field_name: Optional[str] = None
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    created_at: datetime
    user: UserResponse

    model_config = ConfigDict(from_attributes=True)
