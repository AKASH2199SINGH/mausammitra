from fastapi import APIRouter, Query

from server.schemas.advisory import Advisory
from server.services.mock_data import DEFAULT_LOCATION_ID, get_advisory

router = APIRouter(prefix="/advisory", tags=["advisory"])


@router.get("", response_model=Advisory)
async def get_advisory_endpoint(
    mode: str = Query(default="citizen", description="User mode: citizen, farmer, or authority"),
    location_id: str = Query(default=DEFAULT_LOCATION_ID, description="Location ID"),
) -> Advisory:
    """Get advisory for a specific user mode and location."""
    return get_advisory(mode, location_id)
