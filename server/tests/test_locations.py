"""The location catalogue, and the migration off the old ``loc-00N`` ids.

The catalogue grew from three Bihar districts to one entry per state and union
territory, and ids changed from ``loc-001`` to state slugs. Two things break
silently when that happens:

* a retired id left in the ``locations`` table is served *next to* its
  replacement, so the selector offers Patna twice;
* a location with no active alert renders an empty alert feed with no message,
  which reads as a broken page rather than "no warnings here".
"""

import asyncio
import re

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

import server.main as main_module
from server.main import bootstrap_database, create_app
from server.models.location import Location
from server.services.mock_data import (
    DEFAULT_LOCATION_ID,
    LOCATIONS,
    get_alerts,
    get_location,
)

# 28 states + 8 union territories.
INDIAN_STATES_AND_UTS = {
    "Andaman and Nicobar Islands",
    "Andhra Pradesh",
    "Arunachal Pradesh",
    "Assam",
    "Bihar",
    "Chandigarh",
    "Chhattisgarh",
    "Dadra and Nagar Haveli and Daman and Diu",
    "Delhi",
    "Goa",
    "Gujarat",
    "Haryana",
    "Himachal Pradesh",
    "Jammu and Kashmir",
    "Jharkhand",
    "Karnataka",
    "Kerala",
    "Ladakh",
    "Lakshadweep",
    "Madhya Pradesh",
    "Maharashtra",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Odisha",
    "Puducherry",
    "Punjab",
    "Rajasthan",
    "Sikkim",
    "Tamil Nadu",
    "Telangana",
    "Tripura",
    "Uttar Pradesh",
    "Uttarakhand",
    "West Bengal",
}


def _slug(text_value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", text_value.lower()).strip("-")


def test_every_state_and_union_territory_is_represented() -> None:
    assert {loc.state for loc in LOCATIONS} == INDIAN_STATES_AND_UTS


def test_ids_are_unique_and_derived_from_the_state_name() -> None:
    ids = [loc.id for loc in LOCATIONS]
    assert len(ids) == len(set(ids))

    for loc in LOCATIONS:
        state_slug = _slug(loc.state)
        suffix = loc.id.removeprefix("loc-")
        # The state capital takes the bare state slug (``loc-bihar`` = Patna);
        # any additional city in the same state qualifies it (``loc-bihar-gaya``).
        assert suffix == state_slug or suffix.startswith(f"{state_slug}-"), loc.id


def test_default_location_resolves_and_retired_ids_fall_back_to_it() -> None:
    assert DEFAULT_LOCATION_ID in {loc.id for loc in LOCATIONS}
    assert get_location(DEFAULT_LOCATION_ID).id == DEFAULT_LOCATION_ID
    # A pre-renumber id must not leak into chat facts or blank the selector.
    assert get_location("loc-001").id == DEFAULT_LOCATION_ID
    assert get_location(None).id == DEFAULT_LOCATION_ID


def test_retired_ids_resolve_to_the_same_city() -> None:
    """The renumber must not strand pre-existing saved preferences.

    ``loc-001`` was Patna before the change and must still mean Patna after it --
    in the chat fact a citizen reads, and in the areas the alert feed filters on.
    """
    from server.services.mock_data import alert_area_filter, location_label

    assert location_label("loc-001") == "Patna, Bihar"
    assert location_label("loc-002") == "Muzaffarpur, Bihar"
    assert location_label("loc-003") == "Gaya, Bihar"
    assert alert_area_filter("loc-001") == ("Patna", "Patna")
    # An id that names nowhere is reported as-is and hides nothing.
    assert location_label("loc-999") == "loc-999"
    assert alert_area_filter("loc-999") is None
    assert alert_area_filter(None) is None


def test_every_location_has_at_least_one_active_alert() -> None:
    """Selecting any Indian location must not render an empty alert feed."""
    empty = [loc.id for loc in LOCATIONS if not get_alerts(loc.id)]
    assert empty == []


def test_catalogue_is_ordered_by_state_then_city() -> None:
    keys = [(loc.state, loc.name) for loc in LOCATIONS]
    assert keys == sorted(keys)


def test_list_endpoint_returns_the_whole_catalogue(tmp_path, monkeypatch) -> None:
    """``GET /locations`` must serve the catalogue, in catalogue order.

    A bare ``TestClient`` never runs lifespan, so without pointing the app at a
    seeded database this endpoint just dumps whatever rows the ambient file
    happens to hold -- which is exactly how the retired ``loc-001..003`` ids
    survived the renumber.
    """
    import server.db as db_module
    from server.api.v1 import locations as locations_module
    from server.core.config import Settings

    settings = Settings(
        demo_mode=False,
        database_url=f"sqlite+aiosqlite:///{tmp_path}/list.db",
    )
    engine = create_async_engine(settings.database_url)
    maker = async_sessionmaker(engine, expire_on_commit=False)
    monkeypatch.setattr(main_module, "get_settings", lambda: settings)
    monkeypatch.setattr(main_module, "engine", engine)
    monkeypatch.setattr(main_module, "AsyncSessionLocal", maker)
    monkeypatch.setattr(db_module, "AsyncSessionLocal", maker)
    monkeypatch.setattr(locations_module, "get_settings", lambda: settings)

    with TestClient(create_app()) as client:
        body = client.get("/api/v1/locations").json()

    asyncio.run(engine.dispose())
    assert [loc["id"] for loc in body] == [loc.id for loc in LOCATIONS]


def test_stale_location_rows_are_pruned_on_seed(tmp_path, monkeypatch) -> None:
    """A retired id must be deleted, not served beside its replacement."""
    from server.core.config import Settings

    settings = Settings(
        demo_mode=False,
        database_url=f"sqlite+aiosqlite:///{tmp_path}/stale.db",
    )
    monkeypatch.setattr(main_module, "get_settings", lambda: settings)
    engine = create_async_engine(settings.database_url)
    maker = async_sessionmaker(engine, expire_on_commit=False)
    monkeypatch.setattr(main_module, "engine", engine)
    monkeypatch.setattr(main_module, "AsyncSessionLocal", maker)

    async def run() -> None:
        async with engine.begin() as conn:
            await conn.run_sync(main_module.Base.metadata.create_all)
        async with maker() as session:
            session.add(
                Location(
                    id="loc-001",
                    name="Patna",
                    district="Patna",
                    state="Bihar",
                    lat=25.5941,
                    lon=85.1376,
                )
            )
            await session.commit()

        await bootstrap_database()

        async with maker() as session:
            rows = (await session.execute(text("SELECT id FROM locations"))).all()
            ids = {row[0] for row in rows}
        await engine.dispose()

        assert "loc-001" not in ids
        assert ids == {loc.id for loc in LOCATIONS}

    asyncio.run(run())
