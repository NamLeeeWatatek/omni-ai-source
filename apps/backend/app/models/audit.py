"""
Audit Log Model
Tracks all user actions for security and compliance
"""

from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field, JSON, Column
from sqlalchemy import Text


class AuditLog(SQLModel, table=True):
    """Audit log for tracking user actions"""
    __tablename__ = "audit_logs"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    action: str = Field(max_length=100, index=True)  # e.g., "create", "update", "delete", "login"
    resource_type: str = Field(max_length=50, index=True)  # e.g., "flow", "user", "bot"
    resource_id: Optional[int] = Field(default=None, index=True)
    details: dict = Field(default={}, sa_column=Column(JSON))  # Additional context
    ip_address: Optional[str] = Field(default=None, max_length=45)
    user_agent: Optional[str] = Field(default=None, sa_column=Column(Text))
    status: str = Field(default="success", max_length=20)  # success, failed, error
    error_message: Optional[str] = Field(default=None, sa_column=Column(Text))
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)
    
    class Config:
        json_schema_extra = {
            "example": {
                "user_id": 1,
                "action": "create",
                "resource_type": "flow",
                "resource_id": 123,
                "details": {"name": "My Workflow", "status": "draft"},
                "ip_address": "192.168.1.1",
                "user_agent": "Mozilla/5.0...",
                "status": "success"
            }
        }
