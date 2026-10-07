from pydantic import BaseModel


class ServiceStatus(BaseModel):
    name: str
    health: str
    detail: str


class SystemStatus(BaseModel):
    overall: str
    lastSync: str
    latencyMs: int
    offlineCacheReady: bool
    services: list[ServiceStatus]
