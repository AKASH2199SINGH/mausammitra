from pydantic import BaseModel
from typing import Optional


class Coordinates(BaseModel):
    lat: float
    lon: float


class LocationRef(BaseModel):
    id: str
    name: str
    district: str
    state: str
    coords: Coordinates


class Provenance(BaseModel):
    source: str
    issuedAt: str
    validUntil: str
    confidence: float
    model: Optional[str] = None


class CurrentWeather(BaseModel):
    location: LocationRef
    observedAt: str
    condition: str
    temperatureC: float
    feelsLikeC: float
    rainfallMm: float
    rainfall24hMm: float
    windKph: float
    windDirection: str
    humidityPct: float
    pressureHpa: float
    visibilityKm: float
    provenance: Provenance


class ForecastSlot(BaseModel):
    time: str
    label: str
    temperatureC: float
    rainfallMm: float
    rainChancePct: float
    windKph: float
    condition: str
    dominantRisk: Optional[str] = None
    riskLevel: str


class WeatherForecast(BaseModel):
    locationId: str
    issuedAt: str
    slots: list[ForecastSlot]
    provenance: Provenance
