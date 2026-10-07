from pydantic import BaseModel
from typing import Optional


class RiskFactor(BaseModel):
    label: str
    value: str
    weight: float


class HazardRisk(BaseModel):
    hazard: str
    level: str
    score: float
    trend: str
    summary: str
    factors: list[RiskFactor]
    recommendedActions: list[str]
    provenance: dict


class RiskSnapshot(BaseModel):
    locationId: str
    overall: str
    overallSummary: str
    hazards: list[HazardRisk]
    updatedAt: str


class RiskZone(BaseModel):
    id: str
    name: str
    district: str
    state: str
    layer: str
    level: str
    polygon: list[tuple[float, float]]
    centroid: tuple[float, float]
    population: int
    areaKm2: float
    why: str
    factors: list[RiskFactor]
    recommendedAction: str
    provenance: dict
