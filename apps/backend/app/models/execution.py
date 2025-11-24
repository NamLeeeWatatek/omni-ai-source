from sqlmodel import SQLModel, Field, Relationship, Column, JSON
from typing import Optional, List, Dict, Any
from datetime import datetime

class WorkflowExecution(SQLModel, table=True):
    """Tracks each workflow execution instance"""
    __tablename__ = "workflow_executions"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    flow_version_id: int = Field(foreign_key="flow_versions.id")
    conversation_id: Optional[int] = Field(default=None, foreign_key="conversations.id")
    
    # Execution status
    status: str  # 'running', 'completed', 'failed', 'cancelled'
    started_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None
    
    # Data
    input_data: Dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSON))
    output_data: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    error_message: Optional[str] = None
    
    # Progress tracking
    total_nodes: int = 0
    completed_nodes: int = 0
    
    # Relationships
    flow_version: "FlowVersion" = Relationship(back_populates="executions")
    node_executions: List["NodeExecution"] = Relationship(back_populates="workflow_execution")


class NodeExecution(SQLModel, table=True):
    """Tracks individual node execution within a workflow"""
    __tablename__ = "node_executions"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    workflow_execution_id: int = Field(foreign_key="workflow_executions.id")
    
    # Node info
    node_id: str  # ID from the flow JSON
    node_type: str  # 'start', 'message', 'ai-reply', etc.
    node_label: str
    
    # Execution status
    status: str  # 'pending', 'running', 'completed', 'failed', 'skipped'
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    execution_time_ms: Optional[int] = None
    
    # Data
    input_data: Dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSON))
    output_data: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    error_message: Optional[str] = None
    
    # Relationships
    workflow_execution: WorkflowExecution = Relationship(back_populates="node_executions")
