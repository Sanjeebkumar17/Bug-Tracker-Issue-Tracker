from fastapi import APIRouter
from app.api.v1 import (
    auth, users, projects, tickets, comments, 
    attachments, websocket, sprints, tags, notifications
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(projects.router, prefix="/projects", tags=["Projects"])
api_router.include_router(sprints.router, tags=["Agile Sprints"])
api_router.include_router(tags.router, tags=["Tags & Labels"])
api_router.include_router(tickets.router, prefix="/tickets", tags=["Tickets"])
api_router.include_router(comments.router, tags=["Comments"])
api_router.include_router(attachments.router, tags=["Attachments"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])
api_router.include_router(websocket.router, tags=["Real-time WebSockets"])
