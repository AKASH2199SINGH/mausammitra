from fastapi import APIRouter

from server.schemas.system import SystemStatus
from server.services.mock_data import get_system_status

router = APIRouter(prefix="/system", tags=["system"])


@router.get("/status", response_model=SystemStatus)
async def get_system_status_endpoint() -> SystemStatus:
    """Get system status and health information."""
    return get_system_status()
