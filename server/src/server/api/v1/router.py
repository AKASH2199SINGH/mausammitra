from fastapi import APIRouter

from server.api.v1.health import router as health_router
from server.api.v1.weather import router as weather_router
from server.api.v1.alerts import router as alerts_router
from server.api.v1.risk import router as risk_router
from server.api.v1.advisory import router as advisory_router
from server.api.v1.chat import router as chat_router
from server.api.v1.authority import router as authority_router
from server.api.v1.system import router as system_router
from server.api.v1.locations import router as locations_router
from server.api.v1.voice import router as voice_router
from server.api.v1.live import router as live_router

api_v1_router = APIRouter()
api_v1_router.include_router(health_router)
api_v1_router.include_router(locations_router)
api_v1_router.include_router(weather_router)
api_v1_router.include_router(alerts_router)
api_v1_router.include_router(risk_router)
api_v1_router.include_router(advisory_router)
api_v1_router.include_router(chat_router)
api_v1_router.include_router(authority_router)
api_v1_router.include_router(system_router)
api_v1_router.include_router(voice_router)
api_v1_router.include_router(live_router)
