from fastapi import APIRouter, Request
import httpx
from app.core.config import settings

router = APIRouter()

@router.post("/whatsapp")
async def whatsapp_webhook(request: Request):
    """Receive WhatsApp webhooks"""
    data = await request.json()
    # TODO: Process WhatsApp message
    # TODO: Trigger bot flow
    return {"success": True}

@router.post("/messenger")
async def messenger_webhook(request: Request):
    """Receive Messenger webhooks"""
    data = await request.json()
    # TODO: Process Messenger message
    return {"success": True}

@router.post("/instagram")
async def instagram_webhook(request: Request):
    """Receive Instagram webhooks"""
    data = await request.json()
    # TODO: Process Instagram message
    return {"success": True}

@router.post("/n8n-proxy")
async def n8n_proxy(request: Request):
    """Proxy requests to n8n"""
    data = await request.json()
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{settings.N8N_URL}/webhook/{data.get('webhook_id')}",
            json=data.get('payload', {}),
            headers={"Authorization": f"Bearer {settings.N8N_API_KEY}"} if settings.N8N_API_KEY else {}
        )
    
    return response.json()
