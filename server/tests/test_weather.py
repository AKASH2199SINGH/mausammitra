from fastapi.testclient import TestClient

from server.main import create_app

app = create_app()
client = TestClient(app)


def test_get_current_weather() -> None:
    """Test current weather endpoint."""
    response = client.get("/api/v1/weather/current")
    assert response.status_code == 200
    body = response.json()
    assert "location" in body
    assert "observedAt" in body
    assert "temperatureC" in body
    assert "condition" in body


def test_get_current_weather_with_location() -> None:
    """Test current weather endpoint with location parameter."""
    response = client.get("/api/v1/weather/current?location_id=loc-bihar")
    assert response.status_code == 200
    body = response.json()
    assert body["location"]["id"] == "loc-bihar"


def test_get_forecast() -> None:
    """Test forecast endpoint."""
    response = client.get("/api/v1/weather/forecast")
    assert response.status_code == 200
    body = response.json()
    assert "locationId" in body
    assert "slots" in body
    assert isinstance(body["slots"], list)
    assert len(body["slots"]) > 0


def test_get_forecast_with_location() -> None:
    """Test forecast endpoint with location parameter."""
    response = client.get("/api/v1/weather/forecast?location_id=loc-bihar")
    assert response.status_code == 200
    body = response.json()
    assert body["locationId"] == "loc-bihar"
