from typing import Optional
from datetime import datetime
from sqlmodel import SQLModel, Field

class AgentConfigBase(SQLModel):
    name: str
    personality: str = "friendly"  # friendly, professional, casual
    tone: str = "informal"  # formal, informal
    language: str = "en"
    system_prompt: str
    temperature: float = 0.7
    max_tokens: int = 150
    model: str = "gemini-2.5-flash"

class AgentConfig(AgentConfigBase, table=True):
    __tablename__ = "agent_configs"
    id: Optional[int] = Field(default=None, primary_key=True)
    flow_id: int  # FK to flows
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class AgentConfigCreate(AgentConfigBase):
    flow_id: int

class AgentConfigUpdate(SQLModel):
    name: Optional[str] = None
    personality: Optional[str] = None
    tone: Optional[str] = None
    language: Optional[str] = None
    system_prompt: Optional[str] = None
    temperature: Optional[float] = None
    max_tokens: Optional[int] = None
    model: Optional[str] = None

class AgentConfigResponse(AgentConfigBase):
    id: int
    flow_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
