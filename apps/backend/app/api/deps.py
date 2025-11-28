"""
API Dependencies
Provides common dependencies for API endpoints
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Dict, Any, Optional
import jwt
from datetime import datetime

from app.core.config import settings
from app.core.permissions import get_role_permissions, has_permission

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> Dict[str, Any]:
    """
    Get current user from JWT token
    Extracts user info and role from Casdoor JWT
    """
    token = credentials.credentials
    
    try:
        # Decode JWT token
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        
        # Extract user info
        user_id = payload.get("sub")
        email = payload.get("email")
        role = payload.get("role") or payload.get("tag") or "user"  # Try multiple fields
        name = payload.get("name") or payload.get("displayName")
        
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing user ID"
            )
        
        return {
            "id": user_id,
            "email": email,
            "role": role,
            "name": name,
            "permissions": list(get_role_permissions(role))
        }
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired"
        )
    except jwt.JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}"
        )


async def get_current_active_user(
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get current active user
    Can add additional checks here (e.g., is_active, is_verified)
    """
    # Add any additional checks here
    return current_user


def require_permission(permission: str):
    """
    Dependency to require specific permission
    Usage: dependencies=[Depends(require_permission("flow:create"))]
    """
    async def permission_checker(
        current_user: Dict[str, Any] = Depends(get_current_user)
    ):
        user_role = current_user.get("role", "user")
        if not has_permission(user_role, permission):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission denied: requires '{permission}'"
            )
        return current_user
    
    return permission_checker


def require_role(allowed_roles: list):
    """
    Dependency to require specific role(s)
    Usage: dependencies=[Depends(require_role(["admin", "super_admin"]))]
    """
    async def role_checker(
        current_user: Dict[str, Any] = Depends(get_current_user)
    ):
        user_role = current_user.get("role", "user")
        if user_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: requires one of roles {allowed_roles}"
            )
        return current_user
    
    return role_checker


async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Optional[Dict[str, Any]]:
    """
    Get current user if authenticated, None otherwise
    Useful for endpoints that work with or without auth
    """
    if not credentials:
        return None
    
    try:
        return await get_current_user(credentials)
    except HTTPException:
        return None
