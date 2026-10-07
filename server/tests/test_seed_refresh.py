"""Seeding regressions: rows were only inserted when missing, so observations,
alerts and risk snapshots froze at their first-run age forever.

Consequences seen in the wild: "current weather" hours old, alerts whose
validity window had already lapsed still listed as active, and naive local
timestamps from the pre-UTC code being interpreted as UTC (issuing times in the
future).
"""

import asyncio
import json
from datetime import UTC, datetime, timedelta

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

import server.main as main_module
from server.core.config import Settings
from server.models.alert import HazardAlert
from server.models.risk import RiskSnapshot
from server.models.weather import CurrentWeather
from server.services.database import seed_database, _is_stale, _is_naive, utc_iso


def _fresh_session(tmp_path, monkeypatch, name="seed.db"):
    """Create an empty temp DB and point the module engine/session at it."""
    settings = Settings(
        demo_mode=False,
        database_url=f"sqlite+aiosqlite:///{tmp_path}/{name}",
    )
    monkeypatch.setattr(main_module, "get_settings", lambda: settings)

    engine = create_async_engine(settings.database_url)
    maker = async_sessionmaker(engine, expire_on_commit=False)
    monkeypatch.setattr(main_module, "engine", engine)
    monkeypatch.setattr(main_module, "AsyncSessionLocal", maker)

    from server.db import Base
    from server import main as m

    async def create() -> None:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

    asyncio.run(create())
    return engine, maker


def test_seed_inserts_then_refreshes_stale_weather(tmp_path, monkeypatch):
    engine, maker = _fresh_session(tmp_path, monkeypatch)

    async def run() -> None:
        async with maker() as db:
            await seed_database(db)
            row = (
                await db.execute(select(CurrentWeather).limit(1))
            ).scalar_one()
            first_seen = row.observed_at

            # Age the row beyond the freshness window, as if the server had been
            # down for a day.
            stale = (datetime.now(UTC) - timedelta(days=1)).isoformat()
            row.observed_at = stale
            await db.commit()

            await seed_database(db)
            refreshed = (
                await db.execute(select(CurrentWeather).limit(1))
            ).scalar_one()
            assert refreshed.observed_at != stale, "stale observation not refreshed"
            assert refreshed.observed_at == first_seen or refreshed.observed_at > stale

        await engine.dispose()

    asyncio.run(run())


def test_seed_normalizes_naive_timestamps(tmp_path, monkeypatch):
    """Pre-fix rows carry local time without an offset; re-seeding must repair them."""
    engine, maker = _fresh_session(tmp_path, monkeypatch)

    async def run() -> None:
        async with maker() as db:
            await seed_database(db)
            row = (await db.execute(select(CurrentWeather).limit(1))).scalar_one()
            # Simulate a row written by the old naive-local code.
            row.observed_at = datetime.now().replace(tzinfo=None).isoformat()
            await db.commit()
            assert _is_naive(row.observed_at)

            await seed_database(db)
            refreshed = (await db.execute(select(CurrentWeather).limit(1))).scalar_one()
            assert not _is_naive(refreshed.observed_at), "naive timestamp not repaired"
            assert _aware_now_is_utc(refreshed.observed_at)

        await engine.dispose()

    asyncio.run(run())


def _aware_now_is_utc(value: str) -> bool:
    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    return parsed.tzinfo is not None


def test_seed_revives_expired_alerts(tmp_path, monkeypatch):
    """An alert past its validity window must be re-issued, not served as active."""
    engine, maker = _fresh_session(tmp_path, monkeypatch)

    async def run() -> None:
        async with maker() as db:
            await seed_database(db)
            alert = (await db.execute(select(HazardAlert).limit(1))).scalar_one()
            expired = (datetime.now(UTC) - timedelta(hours=5)).isoformat()
            alert.valid_until = expired
            await db.commit()

            await seed_database(db)
            revived = (await db.execute(select(HazardAlert).limit(1))).scalar_one()
            assert revived.valid_until > datetime.now(UTC).isoformat(), (
                "expired alert was not re-issued"
            )

        await engine.dispose()

    asyncio.run(run())


def test_seed_refreshes_aged_risk_snapshots(tmp_path, monkeypatch):
    engine, maker = _fresh_session(tmp_path, monkeypatch)

    async def run() -> None:
        async with maker() as db:
            await seed_database(db)
            snap = (await db.execute(select(RiskSnapshot).limit(1))).scalar_one()
            snap.updated_at = (datetime.now(UTC) - timedelta(days=2)).isoformat()
            snap.hazards_json = json.dumps([{"hazard": "flood", "provenance": {}}])
            await db.commit()

            await seed_database(db)
            refreshed = (await db.execute(select(RiskSnapshot).limit(1))).scalar_one()
            fresh = datetime.now(UTC) - timedelta(hours=1)
            parsed = datetime.fromisoformat(refreshed.updated_at)
            assert parsed > fresh, "aged risk snapshot not refreshed"
            assert json.loads(refreshed.hazards_json)[0]["hazard"] == "flood"
            assert json.loads(refreshed.hazards_json)[0]["provenance"].get("issuedAt")

        await engine.dispose()

    asyncio.run(run())


def test_is_stale_semantics():
    now = datetime.now(UTC)
    assert _is_stale(now.isoformat(), timedelta(hours=1)) is False
    assert _is_stale((now - timedelta(hours=2)).isoformat(), timedelta(hours=1))
    assert _is_stale((now + timedelta(hours=2)).isoformat(), timedelta(0)) is False
    assert _is_stale((now - timedelta(seconds=1)).isoformat(), timedelta(0))
    # naive / garbage inputs are never trusted
    assert _is_stale("2026-10-05T12:00:00", timedelta(days=365))
    assert _is_stale("not-a-date", timedelta())
    assert _is_stale(None, timedelta())
    assert _is_stale(42, timedelta())


def test_utc_iso_only_touches_strings():
    assert utc_iso(17) == 17
    assert utc_iso(None) is None
    assert utc_iso("2026-10-05T12:00:00") == "2026-10-05T12:00:00+00:00"
