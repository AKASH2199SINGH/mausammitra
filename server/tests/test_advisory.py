"""Tests for GET /api/v1/advisory."""
from fastapi.testclient import TestClient

from server.main import create_app

app = create_app()
client = TestClient(app)


def test_advisory_for_every_supported_mode() -> None:
    headlines = {}
    for mode in ("citizen", "farmer", "authority"):
        response = client.get(f"/api/v1/advisory?mode={mode}&location_id=loc-bihar")
        assert response.status_code == 200
        body = response.json()
        assert body["mode"] == mode
        assert body["items"], f"no advisory items returned for {mode}"
        for item in body["items"]:
            assert item["title"]
            assert item["detail"]
            assert item["priority"] in {"routine", "high", "critical"}
        headlines[mode] = body["headline"]

    assert len(set(headlines.values())) == 3, "each mode should get its own headline"


def test_advisory_unknown_mode_falls_back_to_citizen() -> None:
    """Unsupported modes must not be echoed back as if they were valid."""
    response = client.get("/api/v1/advisory?mode=alien&location_id=loc-bihar")
    assert response.status_code == 200
    body = response.json()
    assert body["mode"] == "citizen"
    assert body["headline"] == "Public Advisory"


def test_advisory_carries_provenance() -> None:
    response = client.get("/api/v1/advisory?mode=citizen&location_id=loc-bihar")
    provenance = response.json()["provenance"]
    assert provenance["source"]
    assert 0 <= provenance["confidence"] <= 1
