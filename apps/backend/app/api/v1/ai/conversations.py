"""
AI Conversations API
Manage chat conversations like ChatGPT
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from datetime import datetime

from app.models.ai_conversation import (
    AIConversation, AIConversationCreate, AIConversationResponse,
    AIMessage, AIMessageCreate, AIMessageResponse
)
from app.db.session import get_session
from app.core.auth import get_current_user

router = APIRouter()


@router.get("/", response_model=List[AIConversationResponse])
async def list_conversations(
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """List all conversations for current user"""
    user_id = current_user.get("id") or current_user.get("sub")
    
    query = select(AIConversation).where(
        AIConversation.user_id == str(user_id)
    ).order_by(AIConversation.updated_at.desc())
    
    result = await session.execute(query)
    conversations = result.scalars().all()
    
    return conversations


@router.post("/", response_model=AIConversationResponse)
async def create_conversation(
    conversation: AIConversationCreate,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Create new conversation"""
    user_id = current_user.get("id") or current_user.get("sub")
    
    db_conversation = AIConversation(
        **conversation.model_dump(),
        user_id=str(user_id)
    )
    
    session.add(db_conversation)
    await session.commit()
    await session.refresh(db_conversation)
    
    return db_conversation


@router.get("/{conversation_id}", response_model=AIConversationResponse)
async def get_conversation(
    conversation_id: int,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Get conversation details"""
    conversation = await session.get(AIConversation, conversation_id)
    
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    return conversation


@router.delete("/{conversation_id}")
async def delete_conversation(
    conversation_id: int,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Delete conversation"""
    conversation = await session.get(AIConversation, conversation_id)
    
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    # Delete all messages
    query = select(AIMessage).where(AIMessage.conversation_id == conversation_id)
    result = await session.execute(query)
    messages = result.scalars().all()
    
    for message in messages:
        await session.delete(message)
    
    await session.delete(conversation)
    await session.commit()
    
    return {"status": "success", "message": "Conversation deleted"}


@router.get("/{conversation_id}/messages", response_model=List[AIMessageResponse])
async def get_messages(
    conversation_id: int,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Get all messages in conversation"""
    query = select(AIMessage).where(
        AIMessage.conversation_id == conversation_id
    ).order_by(AIMessage.created_at.asc())
    
    result = await session.execute(query)
    messages = result.scalars().all()
    
    return messages


@router.post("/{conversation_id}/messages", response_model=AIMessageResponse)
async def add_message(
    conversation_id: int,
    message: AIMessageCreate,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Add message to conversation"""
    # Verify conversation exists
    conversation = await session.get(AIConversation, conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    # Create message
    db_message = AIMessage(**message.model_dump())
    session.add(db_message)
    
    # Update conversation
    conversation.message_count += 1
    conversation.updated_at = datetime.utcnow()
    session.add(conversation)
    
    await session.commit()
    await session.refresh(db_message)
    
    return db_message


@router.patch("/{conversation_id}")
async def update_conversation(
    conversation_id: int,
    title: str,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Update conversation title"""
    conversation = await session.get(AIConversation, conversation_id)
    
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    conversation.title = title
    conversation.updated_at = datetime.utcnow()
    
    session.add(conversation)
    await session.commit()
    await session.refresh(conversation)
    
    return conversation
