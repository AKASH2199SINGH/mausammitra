from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from server.core.config import get_settings
from server.db import get_db
from server.schemas.weather import CurrentWeather, WeatherForecast
from server.services.database import get_current_weather as get_db_weather, get_forecast as get_db_forecast
from server.services.external_weather import ExternalWeatherService
from server.services.mock_data import DEFAULT_LOCATION_ID, get_current_weather, get_forecast

router = APIRouter(prefix="/weather", tags=["weather"])


@router.get("/current", response_model=CurrentWeather)
async def get_current_weather_endpoint(
    location_id: str = Query(default=DEFAULT_LOCATION_ID, description="Location ID"),
    db: AsyncSession = Depends(get_db),
) -> CurrentWeather:
    """Get current weather for a location."""
    settings = get_settings()
    
    if not settings.demo_mode:
        # Try database first
        try:
            return await get_db_weather(db, location_id)
        except Exception:
            # Fallback to mock on error
            pass
    
    return get_current_weather(location_id)


@router.get("/forecast", response_model=WeatherForecast)
async def get_forecast_endpoint(
    location_id: str = Query(default=DEFAULT_LOCATION_ID, description="Location ID"),
    db: AsyncSession = Depends(get_db),
) -> WeatherForecast:
    """Get weather forecast for a location."""
    settings = get_settings()
    
    if not settings.demo_mode:
        # Try database first
        try:
            return await get_db_forecast(db, location_id)
        except Exception:
            # Fallback to mock on error
            pass
    
    return get_forecast(location_id)
