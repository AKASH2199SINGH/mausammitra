"""Voice transcription schemas."""
from pydantic import BaseModel


class TranscriptionRequest(BaseModel):
    """Request for voice transcription."""
    language: str = "en"


class TranscriptionResult(BaseModel):
    """Result of voice transcription."""
    text: str
    language: str
    confidence: float
    durationMs: int
