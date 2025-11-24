from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List
from datetime import datetime

class User(SQLModel, table=True):
    __tablename__ = "users"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(unique=True, index=True)
    hashed_password: str
    name: str
    avatar: Optional[str] = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    workspaces: List["WorkspaceMember"] = Relationship(back_populates="user")

class Workspace(SQLModel, table=True):
    __tablename__ = "workspaces"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    slug: str = Field(unique=True, index=True)
    owner_id: int = Field(foreign_key="users.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    members: List["WorkspaceMember"] = Relationship(back_populates="workspace")
    bots: List["Bot"] = Relationship(back_populates="workspace")
    channels: List["Channel"] = Relationship(back_populates="workspace")

class WorkspaceMember(SQLModel, table=True):
    __tablename__ = "workspace_members"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    workspace_id: int = Field(foreign_key="workspaces.id")
    user_id: int = Field(foreign_key="users.id")
    role: str = "member"  # owner, admin, member
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    workspace: Workspace = Relationship(back_populates="members")
    user: User = Relationship(back_populates="workspaces")
