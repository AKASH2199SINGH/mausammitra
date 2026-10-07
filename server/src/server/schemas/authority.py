from pydantic import BaseModel


class AuthorityMetrics(BaseModel):
    activeWarnings: int
    highRiskZones: int
    criticalZones: int
    affectedPopulation: int
    affectedAreaKm2: float
    responseTeamsDeployed: int
    hazardTrend: list[dict]
    priorityLocations: list[dict]
