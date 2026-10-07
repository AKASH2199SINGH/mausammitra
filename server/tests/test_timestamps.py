"""P1 regression: timestamps were naive local datetimes serialized without an
offset, so browsers parsed them as *local* time and every countdown/validity
window drifted by the server's UTC offset.
"""

from datetime import UTC, datetime

from fastapi.testclient import TestClient

from server.main import create_app
from server.services.database import utc_iso

app = create_app()
client = TestClient(app)

SUFFIXES = ("Z", "+00:00", "+05:30")  # anything explicit counts as "aware"


def _as_aware(value: str) -> datetime:
    """Parse a serialized timestamp and fail loudly when it has no offset."""
    assert isinstance(value, str) and value, f"missing timestamp: {value!r}"
    assert value.endswith(SUFFIXES), f"timestamp lacks UTC offset: {value!r}"
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def test_current_weather_timestamps_are_aware() -> None:
    body = client.get("/api/v1/weather/current?location_id=loc-bihar").json()
    observed = _as_aware(body["observedAt"])
    assert observed.tzinfo is not None
    # freshness: within the last hour, not epoch/stale
    delta = abs((datetime.now(UTC) - observed).total_seconds())
    assert delta < 3600, f"observedAt off by {delta}s"

    provenance = body["provenance"]
    issued = _as_aware(provenance["issuedAt"])
    valid_until = _as_aware(provenance["validUntil"])
    assert valid_until > issued


def test_forecast_timestamps_are_aware_and_ordered() -> None:
    body = client.get("/api/v1/weather/forecast?location_id=loc-bihar").json()
    _as_aware(body["issuedAt"])
    _as_aware(body["provenance"]["validUntil"])
    slots = body["slots"]
    assert slots
    times = [_as_aware(slot["time"]) for slot in slots]
    assert times == sorted(times), "forecast slots are out of order"
    # first slot should be ~now, not 1970 / far future
    skew = abs((datetime.now(UTC) - times[0]).total_seconds())
    assert skew < 6 * 3600


def test_alerts_are_aware_and_not_already_expired() -> None:
    alerts = client.get("/api/v1/alerts").json()
    assert alerts
    now = datetime.now(UTC)
    for alert in alerts:
        issued = _as_aware(alert["issuedAt"])
        valid_until = _as_aware(alert["validUntil"])
        assert issued <= now, "alert issued in the future"
        assert valid_until > now, "alert already expired on arrival"


def test_risk_snapshot_timestamps_are_aware() -> None:
    body = client.get("/api/v1/risk?location_id=loc-bihar").json()
    _as_aware(body["updatedAt"])
    for hazard in body["hazards"]:
        provenance = hazard["provenance"]
        _as_aware(provenance["issuedAt"])
        assert _as_aware(provenance["validUntil"]) > datetime.now(UTC)


def test_risk_zone_validity_window_is_aware_and_open() -> None:
    zones = client.get("/api/v1/risk/zones").json()
    assert zones
    for zone in zones:
        provenance = zone["provenance"]
        issued = _as_aware(provenance["issuedAt"])
        valid_until = _as_aware(provenance["validUntil"])
        assert valid_until > issued
        assert valid_until > datetime.now(UTC), "zone validity already lapsed"


def test_advisory_provenance_is_aware() -> None:
    body = client.get("/api/v1/advisory?mode=citizen&location_id=loc-bihar").json()
    issued = _as_aware(body["provenance"]["issuedAt"])
    valid_until = _as_aware(body["provenance"]["validUntil"])
    assert valid_until > issued
    assert valid_until > datetime.now(UTC)


def test_chat_timestamp_is_aware() -> None:
    resp = client.post(
        "/api/v1/chat",
        json={
            "message": "Will it rain today?",
            "mode": "citizen",
            "language": "en",
            "locationId": "loc-bihar",
        },
    )
    assert resp.status_code == 200
    created = _as_aware(resp.json()["createdAt"])
    assert abs((datetime.now(UTC) - created).total_seconds()) < 60


def test_system_status_last_sync_is_aware() -> None:
    body = client.get("/api/v1/system/status").json()
    sync = _as_aware(body["lastSync"])
    assert abs((datetime.now(UTC) - sync).total_seconds()) < 3600


def test_utc_iso_repairs_naive_rows() -> None:
    """Rows written before the fix (naive ISO) must be normalized on read."""
    assert utc_iso("2026-10-05T12:00:00") == "2026-10-05T12:00:00+00:00"
    assert utc_iso("2026-10-05T12:00:00Z") == "2026-10-05T12:00:00+00:00"
    assert utc_iso("2026-10-05T12:00:00+05:30") == "2026-10-05T12:00:00+05:30"


def test_utc_iso_passes_through_non_timestamps() -> None:
    assert utc_iso(None) is None
    assert utc_iso("") == ""
    assert utc_iso(17) == 17
    assert utc_iso("not a date") == "not a date"


def test_db_reads_normalize_naive_seed_rows() -> None:
    """The seeded DB holds naive strings; reads must still emit offsets."""
    body = client.get("/api/v1/risk?location_id=loc-bihar").json()
    _as_aware(body["updatedAt"])
