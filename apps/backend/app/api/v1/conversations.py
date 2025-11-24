from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
from datetime import datetime

router = APIRouter()

class MessageResponse(BaseModel):
    id: int
    conversation_id: int
    direction: str
    content: str
    created_at: datetime

class ConversationResponse(BaseModel):
    id: int
    channel_id: int
    customer_name: str
    last_message: str
    status: str
    messages: List[MessageResponse] = []

@router.get("/", response_model=List[ConversationResponse])
async def list_conversations(workspace_id: int = 1):
    """List all conversations"""
    return [
        {
            "id": 1,
            "channel_id": 1,
            "customer_name": "John Doe",
            "last_message": "Hello!",
            "status": "open",
            "messages": []
        }
    ]

@router.get("/{conversation_id}/messages", response_model=List[MessageResponse])
async def get_messages(conversation_id: int):
    """Get messages for a conversation"""
    return [
        {
            "id": 1,
            "conversation_id": conversation_id,
            "direction": "inbound",
            "content": "Hello!",
            "created_at": datetime.utcnow()
        }
    ]

@router.post("/{conversation_id}/messages")
async def send_message(conversation_id: int, content: str):
    """Send a message in a conversation"""
    # TODO: Send message via channel
    return {"success": True, "message": "Message sent"}
