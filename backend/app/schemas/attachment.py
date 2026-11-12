from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.schemas.user import UserResponse

class AttachmentResponse(BaseModel):
    id: int
    ticket_id: int
    uploader_id: int
    filename: str
    stored_filename: str
    file_path: str
    content_type: str | None
    file_size: int
    created_at: datetime
    uploader: UserResponse

    model_config = ConfigDict(from_attributes=True)
