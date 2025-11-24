from sqlmodel import SQLModel, Field, Relationship, Column, JSON
from typing import Optional, List, Dict, Any
from datetime import datetime

class Conversation(SQLModel, table=True):
    __tablename__ = "conversations"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    channel_id: int = Field(foreign_key="channels.id")
    external_id: str  # ID from the external platform
    customer_name: Optional[str] = None
    customer_avatar: Optional[str] = None
    last_message_at: datetime = Field(default_factory=datetime.utcnow)
    status: str = "open"  # open, assigned, resolved
    assigned_to: Optional[int] = Field(default=None, foreign_key="users.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    channel: "Channel" = Relationship(back_populates="conversations")
    messages: List["Message"] = Relationship(back_populates="conversation")

class Message(SQLModel, table=True):
    __tablename__ = "messages"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    conversation_id: int = Field(foreign_key="conversations.id")
    direction: str  # inbound, outbound
    content: str
    content_type: str = "text"  # text, image, file, audio, video
    metadata: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    conversation: Conversation = Relationship(back_populates="messages")
