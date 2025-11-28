from sqlmodel import SQLModel, Field, Relationship, Column, JSON
from typing import Optional, List, Dict, Any
from datetime import datetime

class Bot(SQLModel, table=True):
    __tablename__ = "bots"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    workspace_id: int = Field(foreign_key="workspaces.id")
    name: str
    description: Optional[str] = None
    icon: Optional[str] = Field(default="FiMessageSquare")  # Icon name from react-icons
    is_active: bool = True
    flow_id: Optional[int] = None  # Which flow this bot executes
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    workspace: "Workspace" = Relationship(back_populates="bots")
    flow_versions: List["FlowVersion"] = Relationship(back_populates="bot")

class FlowVersion(SQLModel, table=True):
    __tablename__ = "flow_versions"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    bot_id: int = Field(foreign_key="bots.id")
    version: int
    flow: Dict[str, Any] = Field(sa_column=Column(JSON))
    is_published: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    bot: Bot = Relationship(back_populates="flow_versions")

