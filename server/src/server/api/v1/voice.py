"""Voice transcription endpoint."""
import random
from fastapi import APIRouter

from server.schemas.voice import TranscriptionRequest, TranscriptionResult

router = APIRouter(prefix="/voice", tags=["voice"])

# Sample utterances for mock transcription
SAMPLE_UTTERANCES = {
    "en": [
        "Will it rain in Kurji this evening?",
        "Can I travel at 6 PM today?",
        "Should I irrigate my field tomorrow?",
    ],
    "hi": [
        "आज शाम कुर्जी में बारिश होगी क्या?",
        "क्या मैं शाम छह बजे निकल सकता हूँ?",
        "कल खेत में सिंचाई करनी चाहिए?",
    ],
}


@router.post("/transcribe", response_model=TranscriptionResult)
async def transcribe_voice(req: TranscriptionRequest) -> TranscriptionResult:
    """Transcribe voice input (mock implementation for prototype)."""
    # In production, this would call a real ASR service like Whisper or Google Speech-to-Text
    # Echo back the language we actually transcribed in: answering English samples while
    # claiming the request's unsupported language mislabels the transcript in the UI.
    language = req.language if req.language in SAMPLE_UTTERANCES else "en"
    samples = SAMPLE_UTTERANCES[language]

    return TranscriptionResult(
        text=random.choice(samples),
        language=language,
        confidence=0.91,
        durationMs=2400,
    )
