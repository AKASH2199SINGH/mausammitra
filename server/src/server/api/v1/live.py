"""WebSocket live updates endpoint."""
import asyncio
import random
from datetime import UTC, datetime
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter(prefix="/live", tags=["live"])


@router.websocket("")
async def websocket_live_updates(websocket: WebSocket) -> None:
    """WebSocket endpoint for live updates."""
    await websocket.accept()
    
    try:
        while True:
            # Waiting on the client instead of a bare sleep notices a dropped
            # connection immediately, instead of leaking a task for one full interval.
            try:
                await asyncio.wait_for(websocket.receive_text(), timeout=15)
            except TimeoutError:
                pass

            payload = {
                "at": datetime.now(UTC).isoformat(),
                "latencyMs": 180 + random.randint(0, 120),
            }
            
            await websocket.send_json(payload)
    except WebSocketDisconnect:
        # Client disconnected
        pass
