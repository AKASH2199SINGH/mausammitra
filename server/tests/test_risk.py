from fastapi.testclient import TestClient

from server.main import create_app

app = create_app()
client = TestClient(app)


def test_get_risk_snapshot() -> None:
    """Test risk snapshot endpoint."""
    response = client.get("/api/v1/risk")
    assert response.status_code == 200
    body = response.json()
    assert "locationId" in body
    assert "overall" in body
    assert "hazards" in body
    assert isinstance(body["hazards"], list)


def test_get_risk_snapshot_with_location() -> None:
    """Test risk snapshot endpoint with location parameter."""
    response = client.get("/api/v1/risk?location_id=loc-bihar")
    assert response.status_code == 200
    body = response.json()
    assert body["locationId"] == "loc-bihar"


def test_get_risk_zones() -> None:
    """Test risk zones endpoint."""
    response = client.get("/api/v1/risk/zones")
    assert response.status_code == 200
    body = response.json()
    assert isinstance(body, list)
    assert len(body) > 0
    assert "id" in body[0]
    assert "name" in body[0]
    assert "level" in body[0]
    assert "layer" in body[0]
