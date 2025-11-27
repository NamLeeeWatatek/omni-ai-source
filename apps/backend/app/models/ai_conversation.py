"""
AI Conversation Models
Chat history and conversations management
"""
from typing import Optional, List
from datetime import datetime
from sqlmodel import SQLModel, Field, Column, JSON

class AIConversation(SQLModel, table=True):
    __tablename__ = "ai_conversations"
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    model: str = "gemini-2.5-flash"
    user_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    message_count: int = 0


class AIConversationCreate(SQLModel):
    title: str
    model: str = "gemini-2.5-flash"


class AIConversationResponse(SQLModel):
    id: int
    title: str
    model: str
    user_id: str
    created_at: datetime
    updated_at: datetime
    message_count: int
    
    class Config:
        from_attributes = True


class AIMessageBase(SQLModel):
    conversation_id: int
    role: str  # user, assistant
    content: str
    model: Optional[str] = None
    tokens_used: Optional[int] = None

class AIMessage(AIMessageBase, table=True):
    __tablename__ = "ai_messages"
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)

class AIMessageCreate(AIMessageBase):
    pass

class AIMessageResponse(AIMessageBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True
