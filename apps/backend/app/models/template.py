from sqlmodel import SQLModel, Field, Column, JSON
from datetime import datetime
from typing import Optional, List


class WorkflowTemplate(SQLModel, table=True):
    __tablename__ = "workflow_templates"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    description: Optional[str] = None
    category: str = Field(default="general", index=True)
    
    # Store workflow structure as JSON
    nodes: List[dict] = Field(default=[], sa_column=Column(JSON))
    edges: List[dict] = Field(default=[], sa_column=Column(JSON))
    
    # Optional reference to original flow
    flow_id: Optional[int] = Field(default=None, foreign_key="flows.id")
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
