"""
Metadata Models - Reusable tags, categories, icons for various entities
"""
from sqlmodel import SQLModel, Field, Column, JSON
from typing import Optional, List
from datetime import datetime


class Tag(SQLModel, table=True):
    """Reusable tags for workflows, templates, bots, etc."""
    __tablename__ = "tags"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(unique=True, index=True)
    color: str = Field(default="#6366f1")  # Hex color
    description: Optional[str] = None
    usage_count: int = Field(default=0)  # Track how many times used
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class Category(SQLModel, table=True):
    """Reusable categories for organizing entities"""
    __tablename__ = "categories"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(unique=True, index=True)
    slug: str = Field(unique=True, index=True)
    icon: Optional[str] = None  # Icon name (e.g., "FiFolder")
    color: str = Field(default="#6366f1")
    description: Optional[str] = None
    entity_type: str = Field(index=True)  # workflow, template, bot, channel, etc.
    parent_id: Optional[int] = Field(default=None, foreign_key="categories.id")  # For nested categories
    order: int = Field(default=0)  # Display order
    is_system: bool = Field(default=False)  # System categories can't be deleted
    usage_count: int = Field(default=0)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class IconLibrary(SQLModel, table=True):
    """Icon library for UI customization"""
    __tablename__ = "icon_library"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(unique=True, index=True)  # Icon identifier (e.g., "FiZap")
    library: str = Field(default="react-icons/fi")  # Icon library
    category: str = Field(default="general")  # general, social, business, etc.
    tags: List[str] = Field(default=[], sa_column=Column(JSON))  # Searchable tags
    is_favorite: bool = Field(default=False)
    usage_count: int = Field(default=0)
    created_at: datetime = Field(default_factory=datetime.utcnow)


# Many-to-Many relationship tables
class WorkflowTag(SQLModel, table=True):
    """Link workflows to tags"""
    __tablename__ = "workflow_tags"
    
    workflow_id: int = Field(foreign_key="flows.id", primary_key=True)
    tag_id: int = Field(foreign_key="tags.id", primary_key=True)


class TemplateTag(SQLModel, table=True):
    """Link templates to tags"""
    __tablename__ = "template_tags"
    
    template_id: int = Field(foreign_key="workflow_templates.id", primary_key=True)
    tag_id: int = Field(foreign_key="tags.id", primary_key=True)


class BotTag(SQLModel, table=True):
    """Link bots to tags"""
    __tablename__ = "bot_tags"
    
    bot_id: int = Field(foreign_key="bots.id", primary_key=True)
    tag_id: int = Field(foreign_key="tags.id", primary_key=True)
