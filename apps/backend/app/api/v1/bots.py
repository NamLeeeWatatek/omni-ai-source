from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime

from app.db.session import get_session
from app.core.auth import get_current_user
from app.core.utils import get_user_id_as_int
from app.models.bot import Bot
from app.models.user import WorkspaceMember
from pydantic import BaseModel

router = APIRouter()

class BotCreate(BaseModel):
    name: str
    description: Optional[str] = None
    icon: Optional[str] = "FiMessageSquare"
    flow_id: Optional[int] = None

class BotUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    icon: Optional[str] = None
    is_active: Optional[bool] = None
    flow_id: Optional[int] = None

@router.get("/")
async def list_bots(
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """List all bots for current user"""
    user_id = current_user.get("id") or current_user.get("sub")
    user_id_int = get_user_id_as_int(user_id)
    
    # Get all workspace IDs where user is a member
    workspace_query = select(WorkspaceMember.workspace_id).where(
        WorkspaceMember.user_id == user_id_int
    )
    workspace_result = await session.execute(workspace_query)
    workspace_ids = workspace_result.scalars().all()
    
    # Get all bots from those workspaces
    if workspace_ids:
        query = select(Bot).where(Bot.workspace_id.in_(workspace_ids))
        result = await session.execute(query)
        bots = result.scalars().all()
    else:
        bots = []
    
    return {"bots": [bot.model_dump() for bot in bots]}

@router.post("/")
async def create_bot(
    bot_data: BotCreate,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Create a new bot"""
    user_id = current_user.get("id") or current_user.get("sub")
    user_id_int = get_user_id_as_int(user_id)
    
    # Get user's first workspace (or create one if none exists)
    workspace_query = select(WorkspaceMember).where(
        WorkspaceMember.user_id == user_id_int
    )
    workspace_result = await session.execute(workspace_query)
    workspace_member = workspace_result.scalar_one_or_none()
    
    if not workspace_member:
        # Create default workspace for user
        from app.models.user import Workspace
        workspace = Workspace(
            name=f"{current_user.get('name', 'User')}'s Workspace",
            slug=f"workspace-{user_id_int}",
            owner_id=user_id_int
        )
        session.add(workspace)
        await session.flush()
        
        # Add user as workspace member
        workspace_member = WorkspaceMember(
            workspace_id=workspace.id,
            user_id=user_id_int,
            role="owner"
        )
        session.add(workspace_member)
        await session.flush()
    
    bot = Bot(
        name=bot_data.name,
        description=bot_data.description,
        icon=bot_data.icon,
        flow_id=bot_data.flow_id,
        workspace_id=workspace_member.workspace_id
    )
    
    session.add(bot)
    await session.commit()
    await session.refresh(bot)
    
    return bot.model_dump()

@router.get("/{bot_id}")
async def get_bot(
    bot_id: int,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Get bot by ID"""
    user_id = current_user.get("id") or current_user.get("sub")
    user_id_int = get_user_id_as_int(user_id)
    bot = await session.get(Bot, bot_id)
    
    if not bot:
        raise HTTPException(status_code=404, detail="Bot not found")
    
    # Verify user is a member of the bot's workspace
    workspace_query = select(WorkspaceMember).where(
        WorkspaceMember.user_id == user_id_int,
        WorkspaceMember.workspace_id == bot.workspace_id
    )
    workspace_result = await session.execute(workspace_query)
    workspace_member = workspace_result.scalar_one_or_none()
    
    if not workspace_member:
        raise HTTPException(status_code=403, detail="Not authorized to access this bot")
    
    return bot.model_dump()

@router.put("/{bot_id}")
async def update_bot(
    bot_id: int,
    bot_data: BotUpdate,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Update bot"""
    user_id = current_user.get("id") or current_user.get("sub")
    user_id_int = get_user_id_as_int(user_id)
    bot = await session.get(Bot, bot_id)
    
    if not bot:
        raise HTTPException(status_code=404, detail="Bot not found")
    
    # Verify user is a member of the bot's workspace
    workspace_query = select(WorkspaceMember).where(
        WorkspaceMember.user_id == user_id_int,
        WorkspaceMember.workspace_id == bot.workspace_id
    )
    workspace_result = await session.execute(workspace_query)
    workspace_member = workspace_result.scalar_one_or_none()
    
    if not workspace_member:
        raise HTTPException(status_code=403, detail="Not authorized to update this bot")
    
    for key, value in bot_data.model_dump(exclude_unset=True).items():
        setattr(bot, key, value)
    
    bot.updated_at = datetime.utcnow()
    session.add(bot)
    await session.commit()
    await session.refresh(bot)
    
    return bot.model_dump()

@router.delete("/{bot_id}")
async def delete_bot(
    bot_id: int,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Delete bot"""
    user_id = current_user.get("id") or current_user.get("sub")
    user_id_int = get_user_id_as_int(user_id)
    bot = await session.get(Bot, bot_id)
    
    if not bot:
        raise HTTPException(status_code=404, detail="Bot not found")
    
    # Verify user is a member of the bot's workspace
    workspace_query = select(WorkspaceMember).where(
        WorkspaceMember.user_id == user_id_int,
        WorkspaceMember.workspace_id == bot.workspace_id
    )
    workspace_result = await session.execute(workspace_query)
    workspace_member = workspace_result.scalar_one_or_none()
    
    if not workspace_member:
        raise HTTPException(status_code=403, detail="Not authorized to delete this bot")
    
    await session.delete(bot)
    await session.commit()
    
    return {"status": "success"}
