from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from server.core.config import get_settings
from server.db import get_db
from server.schemas.alert import HazardAlert
from server.services.database import get_alerts as get_db_alerts
from server.services.mock_data import get_alerts

router = APIRouter(prefix="/alerts", tags=["alerts"])


@router.get("", response_model=list[HazardAlert])
async def get_alerts_endpoint(
    location_id: str | None = Query(default=None, description="Filter by location ID"),
    db: AsyncSession = Depends(get_db),
) -> list[HazardAlert]:
    """Get hazard alerts, optionally filtered by location."""
    settings = get_settings()
    
    if not settings.demo_mode:
        # Try database first
        try:
            return await get_db_alerts(db, location_id)
        except Exception:
            # Fallback to mock on error
            pass
    
    return get_alerts(location_id)
