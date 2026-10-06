from pydantic import BaseModel
from typing import Optional


class AdvisoryItem(BaseModel):
    id: str
    priority: str
    title: str
    detail: str
    window: str
    hazard: Optional[str] = None


class Advisory(BaseModel):
    mode: str
    locationId: str
    headline: str
    items: list[AdvisoryItem]
    provenance: dict
