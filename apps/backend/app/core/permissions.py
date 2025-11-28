"""
Permission and Role Management System
Provides RBAC (Role-Based Access Control) for the application
"""

from enum import Enum
from typing import List, Set


class Role(str, Enum):
    """User roles in the system"""
    SUPER_ADMIN = "super_admin"
    ADMIN = "admin"
    MANAGER = "manager"
    EDITOR = "editor"
    VIEWER = "viewer"
    USER = "user"


class Permission(str, Enum):
    """System permissions"""
    # User permissions
    USER_CREATE = "user:create"
    USER_READ = "user:read"
    USER_UPDATE = "user:update"
    USER_DELETE = "user:delete"
    USER_LIST = "user:list"
    
    # Flow permissions
    FLOW_CREATE = "flow:create"
    FLOW_READ = "flow:read"
    FLOW_UPDATE = "flow:update"
    FLOW_DELETE = "flow:delete"
    FLOW_EXECUTE = "flow:execute"
    FLOW_LIST = "flow:list"
    
    # Template permissions
    TEMPLATE_CREATE = "template:create"
    TEMPLATE_READ = "template:read"
    TEMPLATE_UPDATE = "template:update"
    TEMPLATE_DELETE = "template:delete"
    TEMPLATE_LIST = "template:list"
    
    # Bot permissions
    BOT_CREATE = "bot:create"
    BOT_READ = "bot:read"
    BOT_UPDATE = "bot:update"
    BOT_DELETE = "bot:delete"
    BOT_LIST = "bot:list"
    
    # Channel permissions
    CHANNEL_CREATE = "channel:create"
    CHANNEL_READ = "channel:read"
    CHANNEL_UPDATE = "channel:update"
    CHANNEL_DELETE = "channel:delete"
    CHANNEL_LIST = "channel:list"
    
    # Integration permissions
    INTEGRATION_CREATE = "integration:create"
    INTEGRATION_READ = "integration:read"
    INTEGRATION_UPDATE = "integration:update"
    INTEGRATION_DELETE = "integration:delete"
    INTEGRATION_LIST = "integration:list"
    
    # Settings permissions
    SETTINGS_READ = "settings:read"
    SETTINGS_UPDATE = "settings:update"
    
    # Analytics permissions
    ANALYTICS_READ = "analytics:read"
    ANALYTICS_EXPORT = "analytics:export"
    
    # Metadata permissions
    METADATA_CREATE = "metadata:create"
    METADATA_READ = "metadata:read"
    METADATA_UPDATE = "metadata:update"
    METADATA_DELETE = "metadata:delete"


# Role to permissions mapping
ROLE_PERMISSIONS: dict[Role, Set[str]] = {
    Role.SUPER_ADMIN: {p.value for p in Permission},  # All permissions
    
    Role.ADMIN: {
        Permission.USER_READ.value,
        Permission.USER_CREATE.value,
        Permission.USER_UPDATE.value,
        Permission.USER_LIST.value,
        Permission.FLOW_CREATE.value,
        Permission.FLOW_READ.value,
        Permission.FLOW_UPDATE.value,
        Permission.FLOW_DELETE.value,
        Permission.FLOW_EXECUTE.value,
        Permission.FLOW_LIST.value,
        Permission.TEMPLATE_CREATE.value,
        Permission.TEMPLATE_READ.value,
        Permission.TEMPLATE_UPDATE.value,
        Permission.TEMPLATE_DELETE.value,
        Permission.TEMPLATE_LIST.value,
        Permission.BOT_CREATE.value,
        Permission.BOT_READ.value,
        Permission.BOT_UPDATE.value,
        Permission.BOT_DELETE.value,
        Permission.BOT_LIST.value,
        Permission.CHANNEL_CREATE.value,
        Permission.CHANNEL_READ.value,
        Permission.CHANNEL_UPDATE.value,
        Permission.CHANNEL_DELETE.value,
        Permission.CHANNEL_LIST.value,
        Permission.INTEGRATION_CREATE.value,
        Permission.INTEGRATION_READ.value,
        Permission.INTEGRATION_UPDATE.value,
        Permission.INTEGRATION_LIST.value,
        Permission.SETTINGS_READ.value,
        Permission.SETTINGS_UPDATE.value,
        Permission.ANALYTICS_READ.value,
        Permission.ANALYTICS_EXPORT.value,
        Permission.METADATA_CREATE.value,
        Permission.METADATA_READ.value,
        Permission.METADATA_UPDATE.value,
        Permission.METADATA_DELETE.value,
    },
    
    Role.MANAGER: {
        Permission.FLOW_CREATE.value,
        Permission.FLOW_READ.value,
        Permission.FLOW_UPDATE.value,
        Permission.FLOW_DELETE.value,
        Permission.FLOW_EXECUTE.value,
        Permission.FLOW_LIST.value,
        Permission.TEMPLATE_READ.value,
        Permission.TEMPLATE_CREATE.value,
        Permission.TEMPLATE_UPDATE.value,
        Permission.TEMPLATE_LIST.value,
        Permission.BOT_CREATE.value,
        Permission.BOT_READ.value,
        Permission.BOT_UPDATE.value,
        Permission.BOT_DELETE.value,
        Permission.BOT_LIST.value,
        Permission.CHANNEL_CREATE.value,
        Permission.CHANNEL_READ.value,
        Permission.CHANNEL_UPDATE.value,
        Permission.CHANNEL_LIST.value,
        Permission.INTEGRATION_READ.value,
        Permission.INTEGRATION_UPDATE.value,
        Permission.INTEGRATION_LIST.value,
        Permission.SETTINGS_READ.value,
        Permission.ANALYTICS_READ.value,
        Permission.METADATA_CREATE.value,
        Permission.METADATA_READ.value,
        Permission.METADATA_UPDATE.value,
    },
    
    Role.EDITOR: {
        Permission.FLOW_CREATE.value,
        Permission.FLOW_READ.value,
        Permission.FLOW_UPDATE.value,
        Permission.FLOW_EXECUTE.value,
        Permission.FLOW_LIST.value,
        Permission.TEMPLATE_READ.value,
        Permission.TEMPLATE_CREATE.value,
        Permission.TEMPLATE_UPDATE.value,
        Permission.TEMPLATE_LIST.value,
        Permission.BOT_READ.value,
        Permission.BOT_LIST.value,
        Permission.CHANNEL_READ.value,
        Permission.CHANNEL_LIST.value,
        Permission.INTEGRATION_READ.value,
        Permission.INTEGRATION_LIST.value,
        Permission.ANALYTICS_READ.value,
        Permission.METADATA_READ.value,
        Permission.METADATA_CREATE.value,
        Permission.METADATA_UPDATE.value,
    },
    
    Role.VIEWER: {
        Permission.FLOW_READ.value,
        Permission.FLOW_LIST.value,
        Permission.TEMPLATE_READ.value,
        Permission.TEMPLATE_LIST.value,
        Permission.BOT_READ.value,
        Permission.BOT_LIST.value,
        Permission.CHANNEL_READ.value,
        Permission.CHANNEL_LIST.value,
        Permission.INTEGRATION_READ.value,
        Permission.INTEGRATION_LIST.value,
        Permission.ANALYTICS_READ.value,
        Permission.METADATA_READ.value,
    },
    
    Role.USER: {
        Permission.FLOW_READ.value,
        Permission.FLOW_EXECUTE.value,
        Permission.FLOW_LIST.value,
        Permission.TEMPLATE_READ.value,
        Permission.TEMPLATE_LIST.value,
        Permission.BOT_READ.value,
        Permission.BOT_LIST.value,
        Permission.ANALYTICS_READ.value,
        Permission.METADATA_READ.value,
    },
}


def get_role_permissions(role: str) -> Set[str]:
    """
    Get all permissions for a given role
    
    Args:
        role: Role name as string
        
    Returns:
        Set of permission strings
    """
    try:
        role_enum = Role(role)
        return ROLE_PERMISSIONS.get(role_enum, set())
    except ValueError:
        return set()


def has_permission(user_role: str, required_permission: str) -> bool:
    """
    Check if a user role has a specific permission
    
    Args:
        user_role: User's role as string
        required_permission: Permission to check
        
    Returns:
        True if user has permission, False otherwise
    """
    role_perms = get_role_permissions(user_role)
    return required_permission in role_perms


def has_any_permission(user_role: str, required_permissions: List[str]) -> bool:
    """
    Check if user has any of the required permissions
    
    Args:
        user_role: User's role as string
        required_permissions: List of permissions to check
        
    Returns:
        True if user has at least one permission
    """
    role_perms = get_role_permissions(user_role)
    return any(perm in role_perms for perm in required_permissions)


def has_all_permissions(user_role: str, required_permissions: List[str]) -> bool:
    """
    Check if user has all of the required permissions
    
    Args:
        user_role: User's role as string
        required_permissions: List of permissions to check
        
    Returns:
        True if user has all permissions
    """
    role_perms = get_role_permissions(user_role)
    return all(perm in role_perms for perm in required_permissions)


def is_admin_role(role: str) -> bool:
    """Check if role is admin or super admin"""
    return role in [Role.SUPER_ADMIN.value, Role.ADMIN.value]


def can_manage_users(role: str) -> bool:
    """Check if role can manage users"""
    return has_permission(role, Permission.USER_CREATE.value)


def can_delete_resource(role: str, resource_type: str) -> bool:
    """Check if role can delete a specific resource type"""
    delete_permission = f"{resource_type}:delete"
    return has_permission(role, delete_permission)
