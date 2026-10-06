from datetime import UTC, datetime

from fastapi import APIRouter

from server import __version__
from server.core.config import get_settings

router = APIRouter(tags=["system"])


@router.get("/health")
async def health_check() -> dict[str, str | bool]:
    settings = get_settings()
    return {
        "status": "healthy",
        "service": "mausammitra",
        "version": __version__,
        "demoMode": settings.demo_mode,
        "timestamp": datetime.now(UTC).isoformat(),
    }
