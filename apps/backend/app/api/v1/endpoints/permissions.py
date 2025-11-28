"""
Permissions API Endpoints
Provides permission checking and user capabilities for frontend
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any
from pydantic import BaseModel

from app.core.permissions import (
    Role,
    Permission,
    get_role_permissions,
    has_permission,
    has_any_permission,
    ROLE_PERMISSIONS
)
from app.api.deps import get_current_user

router = APIRouter()


class PermissionCheckRequest(BaseModel):
    """Request to check specific permissions"""
    permissions: List[str]


class PermissionCheckResponse(BaseModel):
    """Response with permission check results"""
    has_permission: bool
    missing_permissions: List[str] = []


class UserCapabilitiesResponse(BaseModel):
    """User capabilities and permissions"""
    role: str
    permissions: List[str]
    can_create: Dict[str, bool]
    can_read: Dict[str, bool]
    can_update: Dict[str, bool]
    can_delete: Dict[str, bool]
    can_execute: Dict[str, bool]
    widgets: Dict[str, bool]  # Widget visibility
    features: Dict[str, bool]  # Feature access


class WidgetConfig(BaseModel):
    """Widget configuration with permissions"""
    id: str
    name: str
    type: str
    visible: bool
    enabled: bool
    required_permissions: List[str]


@router.get("/me/capabilities", response_model=UserCapabilitiesResponse)
async def get_my_capabilities(
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Get current user's capabilities and permissions
    Returns detailed permission matrix for frontend
    """
    user_role = current_user.get("role", "user")
    permissions = list(get_role_permissions(user_role))
    
    # Resource types
    resources = ["user", "flow", "template", "bot", "channel", "integration", "settings", "analytics", "metadata"]
    
    # Build permission matrix
    can_create = {res: has_permission(user_role, f"{res}:create") for res in resources}
    can_read = {res: has_permission(user_role, f"{res}:read") for res in resources}
    can_update = {res: has_permission(user_role, f"{res}:update") for res in resources}
    can_delete = {res: has_permission(user_role, f"{res}:delete") for res in resources}
    can_execute = {
        "flow": has_permission(user_role, "flow:execute"),
    }
    
    # Widget visibility based on permissions
    widgets = {
        "user_management": has_permission(user_role, "user:create"),
        "flow_builder": has_permission(user_role, "flow:create"),
        "template_editor": has_permission(user_role, "template:create"),
        "bot_manager": has_permission(user_role, "bot:create"),
        "channel_manager": has_permission(user_role, "channel:create"),
        "integration_manager": has_permission(user_role, "integration:create"),
        "analytics_dashboard": has_permission(user_role, "analytics:read"),
        "settings_panel": has_permission(user_role, "settings:update"),
        "metadata_editor": has_permission(user_role, "metadata:create"),
        
        # View-only widgets
        "flow_viewer": has_permission(user_role, "flow:read"),
        "template_viewer": has_permission(user_role, "template:read"),
        "bot_viewer": has_permission(user_role, "bot:read"),
        "channel_viewer": has_permission(user_role, "channel:read"),
        "analytics_viewer": has_permission(user_role, "analytics:read"),
    }
    
    # Feature access
    features = {
        "can_export_analytics": has_permission(user_role, "analytics:export"),
        "can_manage_users": has_permission(user_role, "user:create"),
        "can_delete_flows": has_permission(user_role, "flow:delete"),
        "can_delete_templates": has_permission(user_role, "template:delete"),
        "can_delete_bots": has_permission(user_role, "bot:delete"),
        "can_manage_integrations": has_permission(user_role, "integration:create"),
        "can_update_settings": has_permission(user_role, "settings:update"),
        "is_admin": user_role in ["super_admin", "admin"],
        "is_super_admin": user_role == "super_admin",
    }
    
    return UserCapabilitiesResponse(
        role=user_role,
        permissions=permissions,
        can_create=can_create,
        can_read=can_read,
        can_update=can_update,
        can_delete=can_delete,
        can_execute=can_execute,
        widgets=widgets,
        features=features
    )


@router.post("/check", response_model=PermissionCheckResponse)
async def check_permissions(
    request: PermissionCheckRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Check if current user has specific permissions
    """
    user_role = current_user.get("role", "user")
    user_permissions = get_role_permissions(user_role)
    
    missing = [p for p in request.permissions if p not in user_permissions]
    
    return PermissionCheckResponse(
        has_permission=len(missing) == 0,
        missing_permissions=missing
    )


@router.get("/roles", response_model=List[Dict[str, Any]])
async def get_all_roles(
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Get all available roles and their permissions
    Only accessible by admins
    """
    user_role = current_user.get("role", "user")
    if user_role not in ["super_admin", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can view all roles"
        )
    
    roles = []
    for role in Role:
        permissions = list(ROLE_PERMISSIONS.get(role, set()))
        roles.append({
            "name": role.value,
            "display_name": role.value.replace("_", " ").title(),
            "permissions": permissions,
            "permission_count": len(permissions)
        })
    
    return roles


@router.get("/widgets", response_model=List[WidgetConfig])
async def get_available_widgets(
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Get list of widgets available to current user
    Each widget includes visibility and permission requirements
    """
    user_role = current_user.get("role", "user")
    user_permissions = get_role_permissions(user_role)
    
    # Define all widgets with their requirements
    all_widgets = [
        {
            "id": "user_management",
            "name": "User Management",
            "type": "admin",
            "required_permissions": ["user:create", "user:update"]
        },
        {
            "id": "flow_builder",
            "name": "Flow Builder",
            "type": "editor",
            "required_permissions": ["flow:create"]
        },
        {
            "id": "flow_viewer",
            "name": "Flow Viewer",
            "type": "viewer",
            "required_permissions": ["flow:read"]
        },
        {
            "id": "template_editor",
            "name": "Template Editor",
            "type": "editor",
            "required_permissions": ["template:create"]
        },
        {
            "id": "template_viewer",
            "name": "Template Viewer",
            "type": "viewer",
            "required_permissions": ["template:read"]
        },
        {
            "id": "bot_manager",
            "name": "Bot Manager",
            "type": "manager",
            "required_permissions": ["bot:create", "bot:update"]
        },
        {
            "id": "bot_viewer",
            "name": "Bot Viewer",
            "type": "viewer",
            "required_permissions": ["bot:read"]
        },
        {
            "id": "channel_manager",
            "name": "Channel Manager",
            "type": "manager",
            "required_permissions": ["channel:create"]
        },
        {
            "id": "analytics_dashboard",
            "name": "Analytics Dashboard",
            "type": "viewer",
            "required_permissions": ["analytics:read"]
        },
        {
            "id": "settings_panel",
            "name": "Settings",
            "type": "admin",
            "required_permissions": ["settings:update"]
        },
        {
            "id": "integration_manager",
            "name": "Integration Manager",
            "type": "manager",
            "required_permissions": ["integration:create"]
        },
        {
            "id": "metadata_editor",
            "name": "Metadata Editor",
            "type": "editor",
            "required_permissions": ["metadata:create"]
        },
    ]
    
    # Check each widget
    widgets = []
    for widget in all_widgets:
        # Check if user has ALL required permissions
        has_all_perms = all(
            perm in user_permissions 
            for perm in widget["required_permissions"]
        )
        
        # Check if user has ANY required permission (for partial access)
        has_any_perm = any(
            perm in user_permissions 
            for perm in widget["required_permissions"]
        )
        
        widgets.append(WidgetConfig(
            id=widget["id"],
            name=widget["name"],
            type=widget["type"],
            visible=has_any_perm,  # Show if has any permission
            enabled=has_all_perms,  # Enable if has all permissions
            required_permissions=widget["required_permissions"]
        ))
    
    return widgets


@router.get("/resources/{resource_type}", response_model=Dict[str, bool])
async def get_resource_permissions(
    resource_type: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Get permissions for a specific resource type
    Returns CRUD permissions for the resource
    """
    user_role = current_user.get("role", "user")
    
    return {
        "can_create": has_permission(user_role, f"{resource_type}:create"),
        "can_read": has_permission(user_role, f"{resource_type}:read"),
        "can_update": has_permission(user_role, f"{resource_type}:update"),
        "can_delete": has_permission(user_role, f"{resource_type}:delete"),
        "can_list": has_permission(user_role, f"{resource_type}:list"),
    }
