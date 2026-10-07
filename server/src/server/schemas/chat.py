from pydantic import BaseModel
from typing import Optional


class ChatCitation(BaseModel):
    label: str
    detail: str


class ChatMessage(BaseModel):
    id: str
    role: str
    text: str
    createdAt: str
    facts: Optional[list[dict]] = None
    riskLevel: Optional[str] = None
    hazard: Optional[str] = None
    actions: Optional[list[str]] = None
    officialWarningRef: Optional[str] = None
    citations: Optional[list[ChatCitation]] = None
    provenance: Optional[dict] = None


class ChatRequest(BaseModel):
    message: str
    mode: str
    language: str
    locationId: str
