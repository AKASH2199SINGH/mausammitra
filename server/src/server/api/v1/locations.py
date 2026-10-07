from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from server.core.config import get_settings
from server.db import get_db
from server.schemas.weather import LocationRef
from server.services.database import get_locations as get_db_locations
from server.services.mock_data import LOCATIONS

router = APIRouter(prefix="/locations", tags=["locations"])


@router.get("", response_model=list[LocationRef])
async def list_locations(
    db: AsyncSession = Depends(get_db),
) -> list[LocationRef]:
    """Get all available locations."""
    settings = get_settings()
    
    if not settings.demo_mode:
        # Try database first
        try:
            return await get_db_locations(db)
        except Exception:
            # Fallback to mock on error
            pass
    
    return LOCATIONS
