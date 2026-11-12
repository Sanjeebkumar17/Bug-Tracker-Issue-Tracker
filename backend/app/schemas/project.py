from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from app.schemas.user import UserResponse

class ProjectMemberResponse(BaseModel):
    id: int
    user_id: int
    role: str
    joined_at: datetime
    user: UserResponse

    model_config = ConfigDict(from_attributes=True)

class ProjectMemberAdd(BaseModel):
    user_id: int
    role: Optional[str] = "developer"  # admin, developer, viewer

class ProjectMemberUpdate(BaseModel):
    role: str

class ProjectBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    key: str = Field(..., min_length=2, max_length=10, description="Project key, e.g. 'BUG', 'PROJ'")
    description: Optional[str] = None

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    description: Optional[str] = None

class ProjectResponse(ProjectBase):
    id: int
    owner_id: int
    created_at: datetime
    updated_at: datetime
    owner: UserResponse
    members_count: Optional[int] = 0
    tickets_count: Optional[int] = 0

    model_config = ConfigDict(from_attributes=True)

class ProjectDetailResponse(ProjectResponse):
    members: List[ProjectMemberResponse] = []

    model_config = ConfigDict(from_attributes=True)
