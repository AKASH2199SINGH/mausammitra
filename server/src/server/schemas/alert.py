from pydantic import BaseModel
from typing import Optional


class HazardAlert(BaseModel):
    id: str
    kind: str
    hazard: str
    severity: str
    headline: str
    body: str
    areas: list[str]
    issuedAt: str
    validUntil: str
    source: str
    confidence: float
    acknowledged: Optional[bool] = None
