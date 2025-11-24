from sqlmodel import SQLModel, Field, Relationship, Column, JSON
from typing import Optional, List, Dict, Any
from datetime import datetime

class Channel(SQLModel, table=True):
    __tablename__ = "channels"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    workspace_id: int = Field(foreign_key="workspaces.id")
    type: str  # whatsapp, messenger, instagram, telegram, webchat, email
    name: str
    config: Dict[str, Any] = Field(sa_column=Column(JSON))
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    workspace: "Workspace" = Relationship(back_populates="channels")
    conversations: List["Conversation"] = Relationship(back_populates="channel")
