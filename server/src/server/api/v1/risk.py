from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from server.core.config import get_settings
from server.db import get_db
from server.schemas.risk import RiskSnapshot, RiskZone
from server.services.database import get_risk_snapshot as get_db_risk_snapshot, get_risk_zones as get_db_risk_zones
from server.services.mock_data import DEFAULT_LOCATION_ID, get_risk_snapshot, get_risk_zones

router = APIRouter(prefix="/risk", tags=["risk"])


@router.get("", response_model=RiskSnapshot)
async def get_risk_endpoint(
    location_id: str = Query(default=DEFAULT_LOCATION_ID, description="Location ID"),
    db: AsyncSession = Depends(get_db),
) -> RiskSnapshot:
    """Get risk snapshot for a location."""
    settings = get_settings()
    
    if not settings.demo_mode:
        # Try database first
        try:
            return await get_db_risk_snapshot(db, location_id)
        except Exception:
            # Fallback to mock on error
            pass
    
    return get_risk_snapshot(location_id)


@router.get("/zones", response_model=list[RiskZone])
async def get_risk_zones_endpoint(
    db: AsyncSession = Depends(get_db),
) -> list[RiskZone]:
    """Get all risk zones."""
    settings = get_settings()
    
    if not settings.demo_mode:
        # Try database first
        try:
            return await get_db_risk_zones(db)
        except Exception:
            # Fallback to mock on error
            pass
    
    return get_risk_zones()
