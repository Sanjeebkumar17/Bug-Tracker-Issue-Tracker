from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.services.websocket_manager import ws_manager
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.websocket("/ws/{project_id}")
async def websocket_endpoint(websocket: WebSocket, project_id: int):
    await ws_manager.connect(project_id, websocket)
    try:
        while True:
            # Keep connection alive; can receive client ping/pong
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        ws_manager.disconnect(project_id, websocket)
    except Exception as e:
        logger.warning(f"WebSocket error on project {project_id}: {e}")
        ws_manager.disconnect(project_id, websocket)
