from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import HTMLResponse
from typing import Optional
from app.core.config import settings
from urllib.parse import urlencode
import httpx
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from app.db.session import get_session
from app.models.conversation import Channel, ChannelConnection
from app.models.integration import IntegrationConfig
from app.core.auth import get_current_user
from datetime import datetime, timedelta
from pydantic import BaseModel

router = APIRouter()

# Base OAuth Configuration (URLs only)
OAUTH_PROVIDERS = {
    "facebook": {
        "auth_url": "https://www.facebook.com/v18.0/dialog/oauth",
        "token_url": "https://graph.facebook.com/v18.0/oauth/access_token",
        "me_url": "https://graph.facebook.com/v18.0/me",
        "default_scope": "pages_messaging,pages_manage_metadata,pages_read_engagement,pages_show_list",
    },
    "messenger": {  # Same as Facebook
        "auth_url": "https://www.facebook.com/v18.0/dialog/oauth",
        "token_url": "https://graph.facebook.com/v18.0/oauth/access_token",
        "me_url": "https://graph.facebook.com/v18.0/me",
        "default_scope": "pages_messaging,pages_manage_metadata,pages_read_engagement",
    },
    "instagram": {
        "auth_url": "https://api.instagram.com/oauth/authorize",
        "token_url": "https://api.instagram.com/oauth/access_token",
        "me_url": "https://graph.instagram.com/me",
        "default_scope": "instagram_basic,instagram_manage_messages,instagram_manage_comments",
    },
    "whatsapp": {  # Uses Facebook OAuth
        "auth_url": "https://www.facebook.com/v18.0/dialog/oauth",
        "token_url": "https://graph.facebook.com/v18.0/oauth/access_token",
        "me_url": "https://graph.facebook.com/v18.0/me",
        "default_scope": "whatsapp_business_messaging,whatsapp_business_management",
    },
    "google": {
        "auth_url": "https://accounts.google.com/o/oauth2/v2/auth",
        "token_url": "https://oauth2.googleapis.com/token",
        "me_url": "https://www.googleapis.com/oauth2/v2/userinfo",
        "default_scope": "https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile",
    },
    "telegram": {
        # Telegram uses Bot API, not OAuth. Will handle differently
        "auth_url": None,
        "token_url": None,
        "me_url": "https://api.telegram.org/bot{token}/getMe",
        "default_scope": None,
    },
}

@router.get("/callback/{provider}", response_class=HTMLResponse)
async def oauth_callback(
    provider: str,
    code: str,
    state: Optional[str] = None,
    error: Optional[str] = None,
    session: AsyncSession = Depends(get_session)
):
    """
    Handle OAuth callback for channels.
    Exchanges code for token and saves to DB.
    """
    if error:
        return f"<html><body><script>window.opener.postMessage({{status: 'error', message: '{error}'}}, '*'); window.close();</script></body></html>"
    
    provider_lower = provider.lower()
    if provider_lower not in OAUTH_PROVIDERS:
        return f"<html><body><script>window.opener.postMessage({{status: 'error', message: 'Provider not supported'}}, '*'); window.close();</script></body></html>"
    
    provider_config = OAUTH_PROVIDERS[provider_lower]
    
    # User ID from state
    user_id = state 
    if not user_id:
         return f"<html><body><script>window.opener.postMessage({{status: 'error', message: 'Missing state (user_id)'}}, '*'); window.close();</script></body></html>"

    # Fetch Integration Config from DB
    query = select(IntegrationConfig).where(
        IntegrationConfig.user_id == user_id,
        IntegrationConfig.provider == provider_lower
    )
    result = await session.execute(query)
    integration_config = result.scalar_one_or_none()

    if not integration_config:
         return f"<html><body><script>window.opener.postMessage({{status: 'error', message: 'Integration configuration not found for this user. Please configure App ID/Secret first.'}}, '*'); window.close();</script></body></html>"

    try:
        async with httpx.AsyncClient() as client:
            # 1. Exchange code for token
            redirect_uri = f"http://localhost:8002/api/v1/oauth/callback/{provider_lower}" 

            # Token exchange varies by provider
            if provider_lower == "google":
                # Google requires POST with grant_type
                token_resp = await client.post(provider_config["token_url"], data={
                    "client_id": integration_config.client_id,
                    "client_secret": integration_config.client_secret,
                    "redirect_uri": redirect_uri,
                    "code": code,
                    "grant_type": "authorization_code"
                })
            elif provider_lower == "instagram":
                # Instagram requires POST with form data
                token_resp = await client.post(provider_config["token_url"], data={
                    "client_id": integration_config.client_id,
                    "client_secret": integration_config.client_secret,
                    "redirect_uri": redirect_uri,
                    "code": code,
                    "grant_type": "authorization_code"
                })
            else:
                # Facebook, Messenger, WhatsApp use GET
                token_resp = await client.get(provider_config["token_url"], params={
                    "client_id": integration_config.client_id,
                    "client_secret": integration_config.client_secret,
                    "redirect_uri": redirect_uri,
                    "code": code
                })
            
            if token_resp.status_code != 200:
                 raise Exception(f"Token exchange failed: {token_resp.text}")
            
            token_data = token_resp.json()
            access_token = token_data.get("access_token")
            expires_in = token_data.get("expires_in")
            
            # 2. Get User/Page Info (varies by provider)
            if provider_lower == "google":
                # Google uses Authorization header
                me_resp = await client.get(provider_config["me_url"], headers={
                    "Authorization": f"Bearer {access_token}"
                })
            elif provider_lower == "instagram":
                # Instagram uses query param
                me_resp = await client.get(provider_config["me_url"], params={
                    "access_token": access_token,
                    "fields": "id,username"
                })
            else:
                # Facebook, Messenger, WhatsApp
                me_resp = await client.get(provider_config["me_url"], params={
                    "access_token": access_token,
                    "fields": "id,name,picture"
                })
            
            me_data = me_resp.json()
            
            # 3. Save to DB (Channel & Connection)
            # Check if channel exists
            channel_name = me_data.get("name") or me_data.get("username") or me_data.get("email") or "Unknown"
            query = select(Channel).where(Channel.type == provider_lower).where(Channel.name == channel_name)
            result = await session.execute(query)
            channel = result.scalar_one_or_none()
            
            if not channel:
                channel = Channel(
                    name=channel_name,
                    type=provider_lower,
                    is_active=True,
                    icon=me_data.get("picture", {}).get("data", {}).get("url") if isinstance(me_data.get("picture"), dict) else None
                )
                session.add(channel)
                await session.commit()
                await session.refresh(channel)
            
            # Create/Update Connection
            conn_query = select(ChannelConnection).where(
                ChannelConnection.channel_id == channel.id
            ).where(ChannelConnection.user_id == user_id)
            
            result = await session.execute(conn_query)
            connection = result.scalar_one_or_none()
            
            if not connection:
                connection = ChannelConnection(
                    channel_id=channel.id,
                    user_id=user_id,
                    status="active"
                )
            
            connection.access_token = access_token
            connection.token_expires_at = datetime.utcnow() + timedelta(seconds=expires_in) if expires_in else None
            connection.status = "active"
            
            session.add(connection)
            await session.commit()
            
            return f"<html><body><script>window.opener.postMessage({{status: 'success', provider: '{provider}', channel: '{channel.name}'}}, '*'); window.close();</script></body></html>"

    except Exception as e:
        return f"<html><body><script>window.opener.postMessage({{status: 'error', message: '{str(e)}'}}, '*'); window.close();</script></body></html>"

@router.get("/login/{provider}")
async def oauth_login(
    provider: str,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Initiate OAuth flow.
    """
    provider_lower = provider.lower()
    if provider_lower not in OAUTH_PROVIDERS:
        raise HTTPException(status_code=404, detail=f"Provider '{provider}' not supported")
    
    provider_config = OAUTH_PROVIDERS[provider_lower]
    
    # Special handling for Telegram (no OAuth)
    if provider_lower == "telegram":
        raise HTTPException(
            status_code=400,
            detail="Telegram uses Bot Token, not OAuth. Please use the 'Connect Bot' endpoint instead."
        )
    
    # Fetch Integration Config from DB
    user_id = current_user.get("id") or current_user.get("sub")
    query = select(IntegrationConfig).where(
        IntegrationConfig.user_id == user_id,
        IntegrationConfig.provider == provider_lower
    )
    result = await session.execute(query)
    integration_config = result.scalar_one_or_none()

    if not integration_config or not integration_config.client_id:
        raise HTTPException(
            status_code=400, 
            detail=f"Configuration missing. Please configure App ID for {provider} first."
        )
    
    # Use backend callback
    redirect_uri = f"http://localhost:8002/api/v1/oauth/callback/{provider_lower}" 
    
    params = {
        "client_id": integration_config.client_id,
        "redirect_uri": redirect_uri,
        "scope": integration_config.scopes or provider_config["default_scope"],
        "response_type": "code",
        "state": user_id # Pass user ID in state
    }
    
    oauth_url = f"{provider_config['auth_url']}?{urlencode(params)}"
    
    return {"url": oauth_url}

# Telegram-specific endpoint
class TelegramBotConnect(BaseModel):
    bot_token: str

@router.post("/connect/telegram")
async def connect_telegram_bot(
    data: TelegramBotConnect,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Connect Telegram bot using Bot Token (not OAuth)
    """
    user_id = current_user.get("id") or current_user.get("sub")
    
    try:
        async with httpx.AsyncClient() as client:
            # Verify bot token
            me_url = f"https://api.telegram.org/bot{data.bot_token}/getMe"
            resp = await client.get(me_url)
            
            if resp.status_code != 200:
                raise HTTPException(status_code=400, detail="Invalid bot token")
            
            bot_data = resp.json()
            if not bot_data.get("ok"):
                raise HTTPException(status_code=400, detail="Invalid bot token")
            
            bot_info = bot_data["result"]
            bot_name = bot_info.get("username", "Telegram Bot")
            
            # Create/Get Channel
            query = select(Channel).where(Channel.type == "telegram").where(Channel.name == bot_name)
            result = await session.execute(query)
            channel = result.scalar_one_or_none()
            
            if not channel:
                channel = Channel(
                    name=bot_name,
                    type="telegram",
                    is_active=True
                )
                session.add(channel)
                await session.commit()
                await session.refresh(channel)
            
            # Create/Update Connection
            conn_query = select(ChannelConnection).where(
                ChannelConnection.channel_id == channel.id
            ).where(ChannelConnection.user_id == user_id)
            
            result = await session.execute(conn_query)
            connection = result.scalar_one_or_none()
            
            if not connection:
                connection = ChannelConnection(
                    channel_id=channel.id,
                    user_id=user_id,
                    status="active"
                )
            
            connection.access_token = data.bot_token
            connection.status = "active"
            
            session.add(connection)
            await session.commit()
            
            return {"status": "success", "bot_name": bot_name}
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
