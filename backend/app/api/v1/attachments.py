import os
import uuid
import shutil
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.config import settings
from app.core.deps import get_current_user, get_project_role
from app.models.user import User
from app.models.ticket import Ticket
from app.models.attachment import Attachment
from app.schemas.attachment import AttachmentResponse
from app.services.websocket_manager import ws_manager

router = APIRouter()

# Ensure uploads directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

@router.post("/tickets/{ticket_id}/attachments", response_model=AttachmentResponse, status_code=status.HTTP_201_CREATED)
async def upload_attachment(
    ticket_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")

    role = get_project_role(ticket.project_id, current_user, db)
    if not role or role == "viewer":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Viewers cannot upload attachments")

    # Generate unique stored filename
    original_filename = file.filename or "attachment"
    extension = os.path.splitext(original_filename)[1]
    stored_filename = f"{uuid.uuid4().hex}{extension}"
    file_path = os.path.join(settings.UPLOAD_DIR, stored_filename)

    # Save file to disk
    file_size = 0
    with open(file_path, "wb") as buffer:
        content = await file.read()
        file_size = len(content)
        buffer.write(content)

    attachment = Attachment(
        ticket_id=ticket_id,
        uploader_id=current_user.id,
        filename=original_filename,
        stored_filename=stored_filename,
        file_path=file_path,
        content_type=file.content_type,
        file_size=file_size
    )
    db.add(attachment)
    db.commit()
    db.refresh(attachment)

    await ws_manager.broadcast(ticket.project_id, {
        "event": "attachment_added",
        "data": {
            "ticket_id": ticket_id,
            "attachment_id": attachment.id,
            "filename": original_filename
        }
    })

    return attachment

@router.get("/attachments/{attachment_id}/download")
def download_attachment(
    attachment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    attachment = db.query(Attachment).filter(Attachment.id == attachment_id).first()
    if not attachment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Attachment not found")

    ticket = attachment.ticket
    role = get_project_role(ticket.project_id, current_user, db)
    if not role:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    if not os.path.exists(attachment.file_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File missing on disk")

    return FileResponse(
        path=attachment.file_path,
        filename=attachment.filename,
        media_type=attachment.content_type or "application/octet-stream"
    )

@router.delete("/attachments/{attachment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_attachment(
    attachment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    attachment = db.query(Attachment).filter(Attachment.id == attachment_id).first()
    if not attachment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Attachment not found")

    ticket = attachment.ticket
    role = get_project_role(ticket.project_id, current_user, db)
    if current_user.role != "admin" and role != "admin" and attachment.uploader_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot delete this attachment")

    # Remove file from disk
    if os.path.exists(attachment.file_path):
        try:
            os.remove(attachment.file_path)
        except OSError:
            pass

    db.delete(attachment)
    db.commit()
    return None
