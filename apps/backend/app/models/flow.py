from typing import Optional, Dict, Any
from datetime import datetime
from sqlmodel import SQLModel, Field, Column, JSON

class FlowBase(SQLModel):
    name: str
    description: Optional[str] = None
    status: str = "draft"
    version: int = 1
    data: Dict[str, Any] = Field(default={}, sa_column=Column(JSON))

class Flow(FlowBase, table=True):
    __tablename__ = "flows"
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class FlowCreate(FlowBase):
    pass

class FlowUpdate(SQLModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    data: Optional[Dict[str, Any]] = None

class FlowResponse(FlowBase):
    id: int
    user_id: Optional[str]
    created_at: datetime
    updated_at: datetime
