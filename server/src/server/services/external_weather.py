"""External weather API integration service."""
import httpx
from datetime import UTC, datetime, timedelta
from typing import Any

from server.core.config import get_settings
from server.schemas.weather import (
    Coordinates,
    CurrentWeather,
    ForecastSlot,
    LocationRef,
    Provenance,
    WeatherForecast,
)


class ExternalWeatherService:
    """Service for fetching weather data from external APIs like OpenWeather."""
    
    def __init__(self) -> None:
        self.settings = get_settings()
        self.client = httpx.AsyncClient(timeout=30.0)
    
    async def close(self) -> None:
        """Close the HTTP client."""
        await self.client.aclose()
    
    async def get_current_weather(
        self,
        lat: float,
        lon: float,
    ) -> CurrentWeather | None:
        """Fetch current weather from OpenWeather API."""
        if not self.settings.openweather_api_key:
            return None
        
        try:
            url = "https://api.openweathermap.org/data/2.5/weather"
            params = {
                "lat": lat,
                "lon": lon,
                "appid": self.settings.openweather_api_key,
                "units": "metric",
            }
            
            response = await self.client.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            
            return self._parse_current_weather(data)
        except Exception:
            # Return None on error, allowing fallback to mock data
            return None
    
    def _parse_current_weather(self, data: dict[str, Any]) -> CurrentWeather:
        """Parse OpenWeather current weather response."""
        return CurrentWeather(
            location=LocationRef(
                id="external",
                name=data.get("name", "Unknown"),
                district="",
                state="",
                coords=Coordinates(
                    lat=data["coord"]["lat"],
                    lon=data["coord"]["lon"],
                ),
            ),
            observedAt=datetime.now(UTC).isoformat(),
            condition=data["weather"][0]["description"],
            temperatureC=data["main"]["temp"],
            feelsLikeC=data["main"]["feels_like"],
            rainfallMm=data.get("rain", {}).get("1h", 0.0),
            rainfall24hMm=0.0,  # Not available in current weather endpoint
            windKph=data["wind"]["speed"] * 3.6,  # Convert m/s to km/h
            windDirection=self._wind_direction(data["wind"].get("deg", 0)),
            humidityPct=data["main"]["humidity"],
            pressureHpa=data["main"]["pressure"],
            visibilityKm=data.get("visibility", 10000) / 1000,
            provenance=Provenance(
                source="OpenWeather API",
                issuedAt=datetime.now(UTC).isoformat(),
                validUntil=(datetime.now(UTC) + timedelta(hours=1)).isoformat(),
                confidence=0.85,
                model="OpenWeather Current",
            ),
        )
    
    async def get_forecast(
        self,
        lat: float,
        lon: float,
    ) -> WeatherForecast | None:
        """Fetch 5-day forecast from OpenWeather API."""
        if not self.settings.openweather_api_key:
            return None
        
        try:
            url = "https://api.openweathermap.org/data/2.5/forecast"
            params = {
                "lat": lat,
                "lon": lon,
                "appid": self.settings.openweather_api_key,
                "units": "metric",
            }
            
            response = await self.client.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            
            return self._parse_forecast(data)
        except Exception:
            # Return None on error, allowing fallback to mock data
            return None
    
    def _parse_forecast(self, data: dict[str, Any]) -> WeatherForecast:
        """Parse OpenWeather forecast response."""
        slots = []
        now = datetime.now(UTC)
        
        for item in data["list"][:24]:  # Get next 24 hours (3-hour intervals)
            # OpenWeather timestamps are epoch seconds in UTC; without an explicit
            # timezone fromtimestamp() converts to the server's local zone.
            slot_time = datetime.fromtimestamp(item["dt"], tz=UTC)
            slots.append(
                ForecastSlot(
                    time=slot_time.isoformat(),
                    label=f"{(slot_time - now).total_seconds() / 3600:.0f}h",
                    temperatureC=item["main"]["temp"],
                    rainfallMm=item.get("rain", {}).get("3h", 0.0),
                    rainChancePct=item.get("pop", 0) * 100,
                    windKph=item["wind"]["speed"] * 3.6,
                    condition=item["weather"][0]["description"],
                    dominantRisk=None,
                    riskLevel="low",
                )
            )
        
        return WeatherForecast(
            locationId="external",
            issuedAt=now.isoformat(),
            slots=slots,
            provenance=Provenance(
                source="OpenWeather API",
                issuedAt=now.isoformat(),
                validUntil=(now + timedelta(hours=24)).isoformat(),
                confidence=0.80,
                model="OpenWeather Forecast",
            ),
        )
    
    def _wind_direction(self, degrees: int) -> str:
        """Convert wind degrees to cardinal direction."""
        directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"]
        index = round(degrees / 45) % 8
        return directions[index]
