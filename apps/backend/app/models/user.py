from sqlmodel import SQLModel, Field, Relationship, Column, JSON
from typing import Optional, List
from datetime import datetime

class User(SQLModel, table=True):
    __tablename__ = "users"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(unique=True, index=True)
    external_id: Optional[str] = Field(default=None, unique=True, index=True)  # Casdoor UUID
    hashed_password: str
    name: str
    avatar: Optional[str] = None
    
    # RBAC fields
    role: str = Field(default="user", max_length=50)  # user, editor, viewer, manager, admin, super_admin
    permissions: Optional[dict] = Field(default={}, sa_column=Column(JSON))  # Custom permissions
    is_active: bool = Field(default=True)
    last_login: Optional[datetime] = None
    failed_login_attempts: int = Field(default=0)
    locked_until: Optional[datetime] = None
    
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
