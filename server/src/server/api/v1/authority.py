from fastapi import APIRouter

from server.schemas.authority import AuthorityMetrics
from server.services.mock_data import get_authority_metrics

router = APIRouter(prefix="/authority", tags=["authority"])


@router.get("/overview", response_model=AuthorityMetrics)
async def get_authority_metrics_endpoint() -> AuthorityMetrics:
    """Get authority dashboard metrics."""
    return get_authority_metrics()
