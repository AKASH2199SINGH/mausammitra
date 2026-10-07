from fastapi import APIRouter

from server.schemas.chat import ChatMessage, ChatRequest
from server.services.mock_data import process_chat

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("", response_model=ChatMessage)
async def post_chat_endpoint(req: ChatRequest) -> ChatMessage:
    """Process a chat message and return an AI-powered advisory response."""
    return process_chat(req)
