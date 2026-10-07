import logging
from contextlib import asynccontextmanager
from urllib.parse import urlsplit

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.types import ASGIApp

from server.api.v1.health import router as health_router
from server.api.v1.router import api_v1_router
from server.core.config import get_settings
from server.db import AsyncSessionLocal, Base, engine
from server.services.database import seed_database

logger = logging.getLogger(__name__)

# Hosts that identify a local development origin (any port).
_LOCAL_HOSTS = {"localhost", "127.0.0.1", "::1", "[::1]"}


def _is_local_origin(origin: str) -> bool:
    """True when the origin is a plain http(s) URL served from this machine."""
    parts = urlsplit(origin)
    if parts.scheme not in {"http", "https"} or not parts.hostname:
        return False
    return parts.hostname in _LOCAL_HOSTS


class DevCORSMiddleware(CORSMiddleware):
    """CORSMiddleware that can accept any local origin on any port.

    Bundlers (Vite, for one) fall back to the next free port when their preferred
    port is busy, so a fixed allowlist of ``localhost:5173`` style origins breaks the
    client whenever the port moves. Origins pointing at the machine itself are
    therefore accepted while ``cors_allow_local_dev`` is enabled.
    """

    def __init__(self, app: ASGIApp, *, allow_local_origins: bool = False, **kwargs) -> None:
        self.allow_local_origins = allow_local_origins
        super().__init__(app, **kwargs)

    def is_allowed_origin(self, origin: str) -> bool:
        if super().is_allowed_origin(origin):
            return True
        return self.allow_local_origins and _is_local_origin(origin)


async def bootstrap_database() -> None:
    """Create tables and seed reference data on a fresh (or empty) database.

    The API degrades to mock data whenever the database is unusable, so a broken
    or missing database must never keep the service from starting: every failure
    is logged as a warning instead of escaping the lifespan.
    """
    settings = get_settings()
    if settings.demo_mode:
        return
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        async with AsyncSessionLocal() as db:
            await seed_database(db)
    except Exception as exc:  # pragma: no cover - depends on host environment
        logger.warning("Database bootstrap skipped, falling back to demo data: %s", exc)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown events."""
    await bootstrap_database()
    yield


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        description="Weather-to-action intelligence API. Domain routes land in later phases.",
        lifespan=lifespan,
    )
    app.add_middleware(
        DevCORSMiddleware,
        allow_local_origins=settings.cors_allow_local_dev,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(api_v1_router, prefix="/api/v1")
    app.include_router(health_router)
    return app


app = create_app()
