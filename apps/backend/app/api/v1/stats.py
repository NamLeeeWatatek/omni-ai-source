from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select, func
from datetime import datetime, timedelta
from app.db.session import get_session
from app.core.auth import get_current_user
from app.models.flow import Flow
from app.models.bot import Bot
from app.models.conversation import Conversation, Message

router = APIRouter()

@router.get("/dashboard")
async def get_dashboard_stats(
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    # Count flows
    flow_count_query = select(func.count()).select_from(Flow)
    flow_count = (await session.execute(flow_count_query)).scalar() or 0

    # Count active bots
    bot_count_query = select(func.count()).select_from(Bot).where(Bot.is_active == True)
    bot_count = (await session.execute(bot_count_query)).scalar() or 0

    # Count total conversations
    conversation_count_query = select(func.count()).select_from(Conversation)
    conversation_count = (await session.execute(conversation_count_query)).scalar() or 0

    # Count messages today
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    messages_today_query = select(func.count()).select_from(Message).where(
        Message.created_at >= today_start
    )
    messages_today = (await session.execute(messages_today_query)).scalar() or 0

    stats = {
        "total_flows": flow_count,
        "active_bots": bot_count,
        "total_conversations": conversation_count,
        "messages_today": messages_today
    }
    
    return stats
