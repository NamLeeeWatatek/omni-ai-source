from fastapi import APIRouter
from pydantic import BaseModel
from typing import List

router = APIRouter()

class ChannelResponse(BaseModel):
    id: int
    workspace_id: int
    type: str
    name: str
    is_active: bool

@router.get("/", response_model=List[ChannelResponse])
async def list_channels(workspace_id: int = 1):
    """List all channels in workspace"""
    return [
        {
            "id": 1,
            "workspace_id": workspace_id,
            "type": "whatsapp",
            "name": "WhatsApp Business",
            "is_active": True
        }
    ]

@router.post("/")
async def connect_channel(channel_type: str, config: dict):
    """Connect a new channel"""
    # TODO: Validate and save channel
    return {"success": True, "message": f"{channel_type} channel connected"}
