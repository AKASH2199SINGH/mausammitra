from fastapi.testclient import TestClient

from server.main import create_app

app = create_app()
client = TestClient(app)


def test_get_alerts() -> None:
    """Test alerts endpoint."""
    response = client.get("/api/v1/alerts")
    assert response.status_code == 200
    body = response.json()
    assert isinstance(body, list)
    assert len(body) > 0
    assert "id" in body[0]
    assert "kind" in body[0]
    assert "hazard" in body[0]
    assert "severity" in body[0]


def test_get_alerts_with_location() -> None:
    """Test alerts endpoint with location filter."""
    response = client.get("/api/v1/alerts?location_id=loc-bihar")
    assert response.status_code == 200
    body = response.json()
    assert isinstance(body, list)
