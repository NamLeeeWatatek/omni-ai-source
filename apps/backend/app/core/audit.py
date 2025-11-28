"""
Audit Logging Service
Provides centralized audit logging for security and compliance
"""

from datetime import datetime
from typing import Optional
from fastapi import Request
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.audit import AuditLog
import logging

logger = logging.getLogger(__name__)


async def log_action(
    session: AsyncSession,
    user_id: int,
    action: str,
    resource_type: str,
    resource_id: Optional[int] = None,
    details: Optional[dict] = None,
    request: Optional[Request] = None,
    status: str = "success",
    error_message: Optional[str] = None
):
    """
    Log user action for audit trail
    
    Args:
        session: Database session
        user_id: ID of user performing action
        action: Action performed (create, update, delete, etc.)
        resource_type: Type of resource (flow, user, bot, etc.)
        resource_id: ID of affected resource
        details: Additional context as dict
        request: FastAPI request object
        status: Action status (success, failed, error)
        error_message: Error message if action failed
    """
    try:
        audit_log = AuditLog(
            user_id=user_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            details=details or {},
            ip_address=request.client.host if request else None,
            user_agent=request.headers.get("user-agent") if request else None,
            status=status,
            error_message=error_message,
            created_at=datetime.utcnow()
        )
        
        session.add(audit_log)
        await session.commit()
        
        # Also log to application logger for immediate visibility
        log_message = f"Audit: user={user_id} action={action} resource={resource_type}:{resource_id} status={status}"
        if status == "success":
            logger.info(log_message, extra={
                "user_id": user_id,
                "action": action,
                "resource_type": resource_type,
                "resource_id": resource_id,
                "details": details
            })
        else:
            logger.warning(log_message, extra={
                "user_id": user_id,
                "action": action,
                "resource_type": resource_type,
                "resource_id": resource_id,
                "error": error_message,
                "details": details
            })
            
    except Exception as e:
        logger.error(f"Failed to create audit log: {str(e)}", exc_info=True)
        # Don't raise exception - audit logging should not break main flow


async def log_login_attempt(
    session: AsyncSession,
    email: str,
    success: bool,
    request: Optional[Request] = None,
    error_message: Optional[str] = None
):
    """Log login attempt"""
    try:
        audit_log = AuditLog(
            user_id=0,  # Unknown user for failed logins
            action="login",
            resource_type="auth",
            details={"email": email},
            ip_address=request.client.host if request else None,
            user_agent=request.headers.get("user-agent") if request else None,
            status="success" if success else "failed",
            error_message=error_message,
            created_at=datetime.utcnow()
        )
        
        session.add(audit_log)
        await session.commit()
        
    except Exception as e:
        logger.error(f"Failed to log login attempt: {str(e)}", exc_info=True)


async def log_permission_denied(
    session: AsyncSession,
    user_id: int,
    action: str,
    resource_type: str,
    resource_id: Optional[int] = None,
    required_permission: Optional[str] = None,
    request: Optional[Request] = None
):
    """Log permission denied event"""
    await log_action(
        session=session,
        user_id=user_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        details={"required_permission": required_permission},
        request=request,
        status="failed",
        error_message="Permission denied"
    )


async def get_user_activity(
    session: AsyncSession,
    user_id: int,
    limit: int = 100
) -> list[AuditLog]:
    """Get recent activity for a user"""
    from sqlmodel import select
    
    query = select(AuditLog).where(
        AuditLog.user_id == user_id
    ).order_by(
        AuditLog.created_at.desc()
    ).limit(limit)
    
    result = await session.execute(query)
    return result.scalars().all()


async def get_resource_history(
    session: AsyncSession,
    resource_type: str,
    resource_id: int,
    limit: int = 100
) -> list[AuditLog]:
    """Get history for a specific resource"""
    from sqlmodel import select
    
    query = select(AuditLog).where(
        AuditLog.resource_type == resource_type,
        AuditLog.resource_id == resource_id
    ).order_by(
        AuditLog.created_at.desc()
    ).limit(limit)
    
    result = await session.execute(query)
    return result.scalars().all()
