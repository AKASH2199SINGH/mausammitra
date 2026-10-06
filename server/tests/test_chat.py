"""Contract tests for POST /api/v1/chat.

The endpoint previously raised AttributeError on every request (``req.location_id``
vs the model's ``locationId`` field), so the assistant was completely broken.
"""
from fastapi.testclient import TestClient

from server.main import create_app

app = create_app()
client = TestClient(app)


def chat_body(message: str, **overrides) -> dict:
    body = {
        "message": message,
        "mode": "citizen",
        "language": "en",
        "locationId": "loc-bihar",
    }
    body.update(overrides)
    return body


def test_chat_returns_an_assistant_reply() -> None:
    response = client.post("/api/v1/chat", json=chat_body("Will it rain today?"))
    assert response.status_code == 200
    body = response.json()
    assert body["role"] == "assistant"
    assert body["text"]
    assert body["createdAt"]
    assert body["riskLevel"] in {"low", "moderate", "high", "severe"}
    assert body["actions"]


def test_chat_echoes_the_requested_location() -> None:
    response = client.post(
        "/api/v1/chat",
        json=chat_body("Anything new?", locationId="loc-bihar-muzaffarpur"),
    )
    assert response.status_code == 200
    facts = {f["label"]: f["value"] for f in response.json()["facts"]}
    # Citizens see a place name, not a raw "loc-bihar-muzaffarpur" identifier.
    assert facts["Location"] == "Muzaffarpur, Bihar"


def test_chat_falls_back_to_the_raw_id_for_unknown_locations() -> None:
    response = client.post("/api/v1/chat", json=chat_body("Anything new?", locationId="loc-999"))
    assert response.status_code == 200
    facts = {f["label"]: f["value"] for f in response.json()["facts"]}
    assert facts["Location"] == "loc-999"


def test_chat_matches_rain_questions() -> None:
    response = client.post("/api/v1/chat", json=chat_body("Will there be flood risk?"))
    assert response.status_code == 200
    assert response.json()["hazard"] == "flood"


def test_chat_matches_heat_questions() -> None:
    response = client.post("/api/v1/chat", json=chat_body("How hot is the temperature?"))
    assert response.status_code == 200
    assert response.json()["hazard"] == "heat"


def test_chat_rejects_a_request_without_required_fields() -> None:
    response = client.post("/api/v1/chat", json={"message": "hi"})
    assert response.status_code == 422


def test_chat_rejects_an_empty_body() -> None:
    response = client.post("/api/v1/chat", json={})
    assert response.status_code == 422
