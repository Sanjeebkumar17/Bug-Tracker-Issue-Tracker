from pydantic import BaseModel, ConfigDict

class TagBase(BaseModel):
    name: str
    color: str = "#3b82f6"

class TagCreate(TagBase):
    pass

class TagResponse(TagBase):
    id: int
    project_id: int

    model_config = ConfigDict(from_attributes=True)
