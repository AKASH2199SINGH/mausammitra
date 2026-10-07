from fastapi.testclient import TestClient

from server.main import create_app

app = create_app()
client = TestClient(app)


def test_health_under_api_v1() -> None:
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "healthy"
    assert body["service"] == "mausammitra"
    assert "timestamp" in body
    # demoMode can be True or False depending on environment


def test_health_alias() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_tutorial_routes_removed() -> None:
    assert client.get("/items/1").status_code == 404
