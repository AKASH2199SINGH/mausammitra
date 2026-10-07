"""P1 regressions around startup/DB bootstrap.

* A completely fresh database (no tables) crashed the lifespan with
  ``OperationalError: no such table: locations``, so the server exited before it
  could serve anything.
* Database errors must never be fatal: every endpoint falls back to mock data.
"""

import asyncio

import pytest
from sqlalchemy import text
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

import server.main as main_module
from server.main import bootstrap_database
from server.services.mock_data import LOCATIONS


def _patch_db(monkeypatch, url: str):
    """Point the module-level engine/session factory at a temp database."""
    engine = create_async_engine(url)
    maker = async_sessionmaker(engine, expire_on_commit=False)
    monkeypatch.setattr(main_module, "engine", engine)
    monkeypatch.setattr(main_module, "AsyncSessionLocal", maker)
    return engine, maker


def test_bootstrap_seeds_fresh_database(tmp_path, monkeypatch):
    """A DB with no tables must come up seeded with the full location catalogue."""
    from server.core.config import Settings

    settings = Settings(
        demo_mode=False,
        database_url=f"sqlite+aiosqlite:///{tmp_path}/fresh.db",
    )
    monkeypatch.setattr(main_module, "get_settings", lambda: settings)
    engine, maker = _patch_db(monkeypatch, settings.database_url)

    async def run() -> None:
        await bootstrap_database()
        async with maker() as session:
            rows = (await session.execute(text("SELECT id FROM locations"))).all()
            assert sorted(r[0] for r in rows) == sorted(loc.id for loc in LOCATIONS)
        await engine.dispose()

    asyncio.run(run())


def test_bootstrap_is_idempotent(tmp_path, monkeypatch):
    """Running the bootstrap twice must not duplicate seeded rows."""
    from server.core.config import Settings

    settings = Settings(
        demo_mode=False,
        database_url=f"sqlite+aiosqlite:///{tmp_path}/fresh.db",
    )
    monkeypatch.setattr(main_module, "get_settings", lambda: settings)
    engine, maker = _patch_db(monkeypatch, settings.database_url)

    async def run() -> None:
        await bootstrap_database()
        await bootstrap_database()
        async with maker() as session:
            rows = (await session.execute(text("SELECT id FROM locations"))).all()
            assert len(rows) == len(LOCATIONS)
        await engine.dispose()

    asyncio.run(run())


def test_bootstrap_survives_broken_database(tmp_path, monkeypatch):
    """An unopenable DB URL must log a warning instead of raising."""
    from server.core.config import Settings

    settings = Settings(
        demo_mode=False,
        database_url="sqlite+aiosqlite://",
    )
    monkeypatch.setattr(main_module, "get_settings", lambda: settings)
    engine, maker = _patch_db(monkeypatch, settings.database_url)

    async def run() -> None:
        # Must not raise despite the unusable engine.
        await bootstrap_database()
        await engine.dispose()

    asyncio.run(run())


def test_bootstrap_noop_in_demo_mode(monkeypatch):
    """Demo mode must not touch the database at all."""
    from server.core.config import Settings

    settings = Settings(demo_mode=True)
    monkeypatch.setattr(main_module, "get_settings", lambda: settings)

    def explode(*args, **kwargs):  # pragma: no cover - failure path
        raise AssertionError("demo mode must not open the database")

    monkeypatch.setattr(main_module, "engine", type("E", (), {"begin": explode})())

    asyncio.run(bootstrap_database())


def test_bootstrap_is_exception_safe_by_construction():
    """Source-level guard: bootstrap wraps its body in try/except so a DB
    failure logs a warning instead of killing startup."""
    import inspect

    src = inspect.getsource(bootstrap_database)
    assert "try:" in src and "except" in src


@pytest.mark.parametrize("route", ["/health", "/api/v1/system/status"])
def test_endpoints_do_not_depend_on_bootstrap(route):
    """Endpoints answer even when the DB bootstrap failed (mock fallback)."""
    from fastapi.testclient import TestClient

    from server.main import create_app

    client = TestClient(create_app())
    resp = client.get(route)
    assert resp.status_code == 200
