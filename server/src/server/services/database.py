"""Database repository layer for persistent data storage."""
import json
from datetime import UTC, datetime, timedelta
from typing import Any

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from server.models.alert import HazardAlert
from server.models.location import Location
from server.models.risk import RiskSnapshot, RiskZone
from server.models.weather import CurrentWeather, ForecastSlot
from server.schemas.alert import HazardAlert as HazardAlertSchema
from server.schemas.risk import RiskSnapshot as RiskSnapshotSchema, RiskZone as RiskZoneSchema
from server.schemas.weather import (
    CurrentWeather as CurrentWeatherSchema,
    ForecastSlot as ForecastSlotSchema,
    LocationRef,
    WeatherForecast,
)
from server.services.mock_data import (
    alert_area_filter,
    get_advisory,
    get_alerts as get_mock_alerts,
    get_authority_metrics,
    get_current_weather as get_mock_current_weather,
    get_forecast as get_mock_forecast,
    get_risk_snapshot as get_mock_risk_snapshot,
    get_risk_zones as get_mock_risk_zones,
    LOCATIONS,
)


# A stored observation older than this is no longer "current weather": demo rows are
# written once at startup and would otherwise be reported hours later as live data.
OBSERVATION_MAX_AGE = timedelta(hours=1)
# Mirrors the validity window mock_data applies to a fresh observation.
OBSERVATION_VALIDITY = timedelta(hours=1)
# mock_data issues risk provenance with a 6-hour validity window.
RISK_SNAPSHOT_MAX_AGE = timedelta(hours=6)


def _aware(value: Any) -> datetime | None:
    """Parse an ISO-8601 string into an aware datetime; None when unparsable."""
    if not isinstance(value, str) or not value:
        return None
    try:
        parsed = datetime.fromisoformat(value)
    except ValueError:
        return None
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=UTC)
    return parsed


def _is_stale(value: Any, max_age: timedelta) -> bool:
    """True when ``value`` is unparsable, naive, or older than ``max_age``.

    A string without an explicit offset is ambiguous (rows seeded before
    timestamps became timezone-aware were written in local time), so it is
    refreshed instead of being trusted as UTC. ``max_age=timedelta(0)`` means
    "only refresh once the moment has passed", which is how already-expired
    validity windows are detected.
    """
    parsed = _aware(value)
    if parsed is None:
        return True
    if _is_naive(value):
        return True
    return datetime.now(UTC) - parsed > max_age


def _is_naive(value: Any) -> bool:
    """True when ``value`` is an ISO string that carries no UTC offset."""
    if not isinstance(value, str) or not value:
        return False
    try:
        return datetime.fromisoformat(value).tzinfo is None
    except ValueError:
        return False


def utc_iso(value: Any) -> Any:
    """Return an ISO-8601 timestamp that always carries an explicit UTC offset.

    Rows written before timestamps became timezone-aware are stored as naive strings,
    which browsers interpret as local time. Re-attaching UTC on read keeps the API
    unambiguous regardless of when a row was seeded. Non-timestamp values pass through
    untouched so a malformed column can never break a response.
    """
    parsed = _aware(value)
    return parsed.isoformat() if parsed else value


async def seed_database(db: AsyncSession) -> None:
    """Seed the database with initial mock data.

    Time-sensitive rows (observations, alerts, risk snapshots) are refreshed when
    they go stale or were written without a UTC offset: seeding only on insert
    would freeze them at their first-run age and serve expired validity windows.
    """
    # Locations that left the catalogue must not linger. get_locations() serves
    # every row in this table, so a retired id would show up in the selector next
    # to its replacement -- the pre-renumber "loc-001" Patna beside "loc-bihar"
    # Patna. Dependent weather/risk rows go first because they point at the
    # location; nothing outside the seed writes these tables.
    catalogue_ids = [loc.id for loc in LOCATIONS]
    stale_locations = (
        (
            await db.execute(
                select(Location).where(Location.id.not_in(catalogue_ids))
            )
        )
        .scalars()
        .all()
    )
    stale_ids = [row.id for row in stale_locations]
    if stale_ids:
        await db.execute(
            delete(CurrentWeather).where(CurrentWeather.location_id.in_(stale_ids))
        )
        await db.execute(
            delete(ForecastSlot).where(ForecastSlot.location_id.in_(stale_ids))
        )
        await db.execute(
            delete(RiskSnapshot).where(RiskSnapshot.location_id.in_(stale_ids))
        )
        for row in stale_locations:
            await db.delete(row)

    # Seed locations
    for loc in LOCATIONS:
        existing = await db.execute(
            select(Location).where(Location.id == loc.id)
        )
        if not existing.scalar_one_or_none():
            db_location = Location(
                id=loc.id,
                name=loc.name,
                district=loc.district,
                state=loc.state,
                lat=loc.coords.lat,
                lon=loc.coords.lon,
            )
            db.add(db_location)
    
    # Seed current weather
    for loc_id in [loc.id for loc in LOCATIONS]:
        weather = get_mock_current_weather(loc_id)
        existing = await db.execute(
            select(CurrentWeather).where(CurrentWeather.id == f"weather-{loc_id}")
        )
        db_weather = existing.scalar_one_or_none()
        if db_weather is None:
            db.add(CurrentWeather(
                id=f"weather-{loc_id}",
                location_id=loc_id,
                observed_at=weather.observedAt,
                condition=weather.condition,
                temperature_c=weather.temperatureC,
                feels_like_c=weather.feelsLikeC,
                rainfall_mm=weather.rainfallMm,
                rainfall_24h_mm=weather.rainfall24hMm,
                wind_kph=weather.windKph,
                wind_direction=weather.windDirection,
                humidity_pct=weather.humidityPct,
                pressure_hpa=weather.pressureHpa,
                visibility_km=weather.visibilityKm,
                source=weather.provenance.source,
                confidence=weather.provenance.confidence,
            ))
        elif _is_stale(db_weather.observed_at, OBSERVATION_MAX_AGE):
            db_weather.observed_at = weather.observedAt

    # Seed alerts
    alerts = get_mock_alerts()
    for alert in alerts:
        existing = await db.execute(
            select(HazardAlert).where(HazardAlert.id == alert.id)
        )
        db_alert = existing.scalar_one_or_none()
        if db_alert is None:
            db.add(HazardAlert(
                id=alert.id,
                kind=alert.kind,
                hazard=alert.hazard,
                severity=alert.severity,
                headline=alert.headline,
                body=alert.body,
                areas=json.dumps(alert.areas),
                issued_at=alert.issuedAt,
                valid_until=alert.validUntil,
                source=alert.source,
                confidence=alert.confidence,
            ))
        elif _is_stale(db_alert.valid_until, timedelta(0)) or _is_stale(db_alert.issued_at, timedelta(0)):
            # Re-seed an ambiguous or expired alert so the feed never shows a lapsed
            # warning as active (seeding only on insert froze these at first-run time).
            db_alert.issued_at = alert.issuedAt
            db_alert.valid_until = alert.validUntil

    # Seed risk zones
    zones = get_mock_risk_zones()
    for zone in zones:
        existing = await db.execute(
            select(RiskZone).where(RiskZone.id == zone.id)
        )
        if not existing.scalar_one_or_none():
            db_zone = RiskZone(
                id=zone.id,
                name=zone.name,
                district=zone.district,
                state=zone.state,
                layer=zone.layer,
                level=zone.level,
                polygon=json.dumps(zone.polygon),
                centroid=json.dumps(zone.centroid),
                population=zone.population,
                area_km2=zone.areaKm2,
                why=zone.why,
                factors_json=json.dumps([f.model_dump() for f in zone.factors]),
                recommended_action=zone.recommendedAction,
                source=zone.provenance["source"],
                confidence=zone.provenance["confidence"],
            )
            db.add(db_zone)
    
    # Seed risk snapshots
    for loc_id in [loc.id for loc in LOCATIONS]:
        snapshot = get_mock_risk_snapshot(loc_id)
        existing = await db.execute(
            select(RiskSnapshot).where(RiskSnapshot.location_id == loc_id)
        )
        db_snapshot = existing.scalar_one_or_none()
        if db_snapshot is None:
            db.add(RiskSnapshot(
                id=f"risk-{loc_id}",
                location_id=loc_id,
                overall=snapshot.overall,
                overall_summary=snapshot.overallSummary,
                updated_at=snapshot.updatedAt,
                hazards_json=json.dumps([h.model_dump() for h in snapshot.hazards]),
            ))
        elif _is_stale(db_snapshot.updated_at, RISK_SNAPSHOT_MAX_AGE):
            db_snapshot.updated_at = snapshot.updatedAt
            db_snapshot.hazards_json = json.dumps(
                [h.model_dump() for h in snapshot.hazards]
            )
    
    await db.commit()


async def get_locations(db: AsyncSession) -> list[LocationRef]:
    """Get all locations from database."""
    result = await db.execute(select(Location))
    db_locations = result.scalars().all()

    refs = [
        LocationRef(
            id=loc.id,
            name=loc.name,
            district=loc.district,
            state=loc.state,
            coords={"lat": loc.lat, "lon": loc.lon},
        )
        for loc in db_locations
    ]
    # SQLite returns rows in storage order, which drifts once rows are pruned and
    # re-added. The selector renders in this order, so pin it to the catalogue's
    # state-then-city ordering rather than letting it depend on insert history.
    order = {loc.id: i for i, loc in enumerate(LOCATIONS)}
    refs.sort(key=lambda r: order.get(r.id, len(order)))
    return refs


async def get_current_weather(db: AsyncSession, location_id: str) -> CurrentWeatherSchema:
    """Get current weather from database."""
    result = await db.execute(
        select(CurrentWeather).where(CurrentWeather.location_id == location_id)
    )
    weather = result.scalar_one_or_none()
    
    if not weather:
        # Fallback to mock if not in database
        return get_mock_current_weather(location_id)

    observed_at = _aware(weather.observed_at)
    if observed_at is None or datetime.now(UTC) - observed_at > OBSERVATION_MAX_AGE:
        # Demo rows are inserted once at startup, so serving them hours later would
        # present stale readings as live observations (and expired validity windows).
        return get_mock_current_weather(location_id)

    # Get location
    loc_result = await db.execute(
        select(Location).where(Location.id == location_id)
    )
    loc = loc_result.scalar_one_or_none()

    return CurrentWeatherSchema(
        location=LocationRef(
            id=loc.id if loc else location_id,
            name=loc.name if loc else "Unknown",
            district=loc.district if loc else "Unknown",
            state=loc.state if loc else "Unknown",
            coords={"lat": loc.lat if loc else 0, "lon": loc.lon if loc else 0},
        ),
        observedAt=utc_iso(weather.observed_at),
        condition=weather.condition,
        temperatureC=weather.temperature_c,
        feelsLikeC=weather.feels_like_c,
        rainfallMm=weather.rainfall_mm,
        rainfall24hMm=weather.rainfall_24h_mm,
        windKph=weather.wind_kph,
        windDirection=weather.wind_direction,
        humidityPct=weather.humidity_pct,
        pressureHpa=weather.pressure_hpa,
        visibilityKm=weather.visibility_km,
        provenance={
            "source": weather.source,
            "issuedAt": utc_iso(weather.observed_at),
            # Validity must start at the observation, not expire with it: reporting
            # validUntil == issuedAt marks every fresh reading as already expired.
            "validUntil": (observed_at + OBSERVATION_VALIDITY).isoformat(),
            "confidence": weather.confidence,
        },
    )


async def get_forecast(db: AsyncSession, location_id: str) -> WeatherForecast:
    """Get forecast from database."""
    result = await db.execute(
        select(ForecastSlot).where(ForecastSlot.location_id == location_id)
    )
    slots = result.scalars().all()
    
    if not slots:
        # Fallback to mock if not in database
        return get_mock_forecast(location_id)
    
    first_time = utc_iso(slots[0].time) if slots else datetime.now(UTC).isoformat()
    return WeatherForecast(
        locationId=location_id,
        issuedAt=first_time,
        slots=[
            ForecastSlotSchema(
                time=utc_iso(slot.time),
                label=slot.label,
                temperatureC=slot.temperature_c,
                rainfallMm=slot.rainfall_mm,
                rainChancePct=slot.rain_chance_pct,
                windKph=slot.wind_kph,
                condition=slot.condition,
                dominantRisk=slot.dominant_risk,
                riskLevel=slot.risk_level,
            )
            for slot in slots
        ],
        provenance={
            "source": "Database",
            "issuedAt": first_time,
            "validUntil": utc_iso(slots[-1].time),
            "confidence": 0.85,
        },
    )


async def get_alerts(db: AsyncSession, location_id: str | None = None) -> list[HazardAlertSchema]:
    """Get alerts from database."""
    result = await db.execute(select(HazardAlert))
    alerts = result.scalars().all()
    
    if not alerts:
        # Fallback to mock if not in database
        return get_mock_alerts(location_id)
    
    alert_schemas = [
        HazardAlertSchema(
            id=alert.id,
            kind=alert.kind,
            hazard=alert.hazard,
            severity=alert.severity,
            headline=alert.headline,
            body=alert.body,
            areas=json.loads(alert.areas),
            issuedAt=utc_iso(alert.issued_at),
            validUntil=utc_iso(alert.valid_until),
            source=alert.source,
            confidence=alert.confidence,
        )
        for alert in alerts
    ]
    
    # Both data sources filter through the catalogue so they agree row for row:
    # the `locations` table is seeded from it, so re-querying it for the same two
    # strings would only give them a chance to drift apart.
    areas_filter = alert_area_filter(location_id)
    if areas_filter is not None:
        district, name = areas_filter
        alert_schemas = [
            a for a in alert_schemas if district in a.areas or name in a.areas
        ]

    return alert_schemas


async def get_risk_snapshot(db: AsyncSession, location_id: str) -> RiskSnapshotSchema:
    """Get risk snapshot from database."""
    result = await db.execute(
        select(RiskSnapshot).where(RiskSnapshot.location_id == location_id)
    )
    snapshot = result.scalar_one_or_none()
    
    if not snapshot:
        # Fallback to mock if not in database
        return get_mock_risk_snapshot(location_id)
    
    hazards = json.loads(snapshot.hazards_json)
    for hazard in hazards:
        provenance = hazard.get("provenance")
        if isinstance(provenance, dict):
            for key in ("issuedAt", "validUntil"):
                if isinstance(provenance.get(key), str):
                    provenance[key] = utc_iso(provenance[key])

    return RiskSnapshotSchema(
        locationId=snapshot.location_id,
        overall=snapshot.overall,
        overallSummary=snapshot.overall_summary,
        hazards=hazards,
        updatedAt=utc_iso(snapshot.updated_at),
    )


async def get_risk_zones(db: AsyncSession) -> list[RiskZoneSchema]:
    """Get risk zones from database."""
    result = await db.execute(select(RiskZone))
    zones = result.scalars().all()
    
    if not zones:
        # Fallback to mock if not in database
        return get_mock_risk_zones()
    
    return [
        RiskZoneSchema(
            id=zone.id,
            name=zone.name,
            district=zone.district,
            state=zone.state,
            layer=zone.layer,
            level=zone.level,
            polygon=json.loads(zone.polygon),
            centroid=json.loads(zone.centroid),
            population=zone.population,
            areaKm2=zone.area_km2,
            why=zone.why,
            factors=json.loads(zone.factors_json),
            recommendedAction=zone.recommended_action,
            provenance={
                "source": zone.source,
                # The zone table has no validity columns, so keep a stable window
                # instead of reporting an already-expired "validUntil".
                "issuedAt": datetime.now(UTC).isoformat(),
                "validUntil": (datetime.now(UTC) + timedelta(hours=12)).isoformat(),
                "confidence": zone.confidence,
            },
        )
        for zone in zones
    ]
