from typing import Optional, Dict, Any, List, TYPE_CHECKING
from datetime import datetime
from sqlmodel import SQLModel, Field, Column, JSON, Relationship

if TYPE_CHECKING:
    from app.models.execution import WorkflowExecution

class FlowBase(SQLModel):
    name: str
    description: Optional[str] = None
    status: str = "draft"
    version: int = 1
    template_id: Optional[int] = None  # Reference to template used
    data: Dict[str, Any] = Field(default={}, sa_column=Column(JSON))

class Flow(FlowBase, table=True):
    __tablename__ = "flows"
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: Optional[str] = None
    channel_id: Optional[int] = None  # Which channel this flow is for
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    executions: List["WorkflowExecution"] = Relationship(back_populates="flow")

class FlowCreate(FlowBase):
    pass

class FlowUpdate(SQLModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    template_id: Optional[int] = None
    data: Optional[Dict[str, Any]] = None
    channel_id: Optional[int] = None

class FlowResponse(FlowBase):
    id: int
    user_id: Optional[str]
    channel_id: Optional[int]
    template_id: Optional[int]
    created_at: datetime
    updated_at: datetime
