from fastapi.testclient import TestClient

from server.main import create_app

app = create_app()
client = TestClient(app)


def test_voice_transcribe() -> None:
    """Test voice transcription endpoint."""
    response = client.post(
        "/api/v1/voice/transcribe",
        json={"language": "en"},
    )
    assert response.status_code == 200
    body = response.json()
    assert "text" in body
    assert body["language"] == "en"
    assert "confidence" in body
    assert "durationMs" in body


def test_voice_transcribe_hindi() -> None:
    """Test voice transcription endpoint with Hindi."""
    response = client.post(
        "/api/v1/voice/transcribe",
        json={"language": "hi"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["language"] == "hi"


def test_voice_transcribe_unsupported_language_falls_back_to_english() -> None:
    """Regression: `language: "fr"` used to be echoed back verbatim even though
    only English/Hindi sample utterances exist, mislabelling the transcript."""
    response = client.post(
        "/api/v1/voice/transcribe",
        json={"language": "fr"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["language"] == "en"
    # transcript must come from the English bank it claims
    assert body["text"] in __import__(
        "server.api.v1.voice", fromlist=["SAMPLE_UTTERANCES"]
    ).SAMPLE_UTTERANCES["en"]
