from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict

class SprintBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    goal: Optional[str] = None
    status: Optional[str] = "future"  # future, active, completed
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

class SprintCreate(SprintBase):
    pass

class SprintUpdate(BaseModel):
    name: Optional[str] = None
    goal: Optional[str] = None
    status: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

class SprintResponse(SprintBase):
    id: int
    project_id: int
    created_at: datetime
    updated_at: datetime
    tickets_count: Optional[int] = 0
    total_story_points: Optional[int] = 0

    model_config = ConfigDict(from_attributes=True)
