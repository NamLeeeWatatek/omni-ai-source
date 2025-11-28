# Permissions & RBAC Guide

## Overview

WataOmi implements Role-Based Access Control (RBAC) to manage user permissions and access to resources.

## Roles

### Role Hierarchy

```
super_admin (Full Access)
    ↓
admin (Organization Admin)
    ↓
manager (Campaign Manager)
    ↓
editor (Content Editor)
    ↓
viewer (Read-Only)
    ↓
user (Basic User)
```

### Role Definitions

#### Super Admin
- **Purpose**: System administrator with full access
- **Use Case**: Platform owners, system administrators
- **Permissions**: All permissions

#### Admin
- **Purpose**: Organization administrator
- **Use Case**: Organization owners, IT managers
- **Permissions**: All except user deletion and system settings

#### Manager
- **Purpose**: Campaign and content manager
- **Use Case**: Marketing managers, team leads
- **Permissions**: Create/manage campaigns, bots, channels, integrations

#### Editor
- **Purpose**: Content creator and editor
- **Use Case**: Content creators, copywriters
- **Permissions**: Create/edit flows, templates, metadata

#### Viewer
- **Purpose**: Read-only access
- **Use Case**: Stakeholders, analysts
- **Permissions**: View all resources, analytics

#### User
- **Purpose**: Basic user with limited access
- **Use Case**: End users, customers
- **Permissions**: Execute flows, view limited resources

## Permission Format

Permissions follow the pattern: `resource:action`

### Actions
- `create` - Create new resources
- `read` - View resources
- `update` - Edit resources
- `delete` - Delete resources
- `list` - List resources
- `execute` - Execute/run resources

### Resources
- `user` - User management
- `flow` - Automation flows
- `template` - Message templates
- `bot` - Chatbots
- `channel` - Communication channels
- `integration` - External integrations
- `settings` - System settings
- `analytics` - Analytics and reports
- `metadata` - Tags, categories, icons

## Permission Matrix

| Resource | super_admin | admin | manager | editor | viewer | user |
|----------|-------------|-------|---------|--------|--------|------|
| **Users** |
| create | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| read | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| update | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| delete | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Flows** |
| create | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| read | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| update | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| delete | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| execute | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| **Templates** |
| create | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| read | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| update | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| delete | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Bots** |
| create | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| read | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| update | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| delete | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Channels** |
| create | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| read | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| update | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| delete | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Analytics** |
| read | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| export | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Settings** |
| read | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| update | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

## API Usage

### Get User Capabilities

```http
GET /api/v1/permissions/me/capabilities
Authorization: Bearer <token>

Response:
{
  "role": "manager",
  "permissions": ["flow:create", "flow:read", ...],
  "can_create": {
    "user": false,
    "flow": true,
    "template": true,
    "bot": true,
    "channel": true,
    ...
  },
  "can_read": {
    "user": false,
    "flow": true,
    ...
  },
  "can_update": {...},
  "can_delete": {...},
  "can_execute": {
    "flow": true
  },
  "widgets": {
    "user_management": false,
    "flow_builder": true,
    "template_editor": true,
    "bot_manager": true,
    "analytics_dashboard": true,
    ...
  },
  "features": {
    "can_export_analytics": false,
    "can_manage_users": false,
    "can_delete_flows": true,
    "is_admin": false,
    "is_super_admin": false
  }
}
```

### Check Specific Permissions

```http
POST /api/v1/permissions/check
Authorization: Bearer <token>
Content-Type: application/json

{
  "permissions": ["flow:create", "flow:delete"]
}

Response:
{
  "has_permission": true,
  "missing_permissions": []
}
```

### Get Available Widgets

```http
GET /api/v1/permissions/widgets
Authorization: Bearer <token>

Response:
[
  {
    "id": "flow_builder",
    "name": "Flow Builder",
    "type": "editor",
    "visible": true,
    "enabled": true,
    "required_permissions": ["flow:create"]
  },
  ...
]
```

### Get Resource Permissions

```http
GET /api/v1/permissions/resources/flow
Authorization: Bearer <token>

Response:
{
  "can_create": true,
  "can_read": true,
  "can_update": true,
  "can_delete": true,
  "can_list": true
}
```

## Backend Implementation

### Protect Endpoints with Permissions

```python
from fastapi import APIRouter, Depends
from app.api.deps import require_permission

router = APIRouter()

@router.post("/flows")
async def create_flow(
    flow_data: FlowCreate,
    current_user = Depends(require_permission("flow:create"))
):
    # Only users with flow:create permission can access
    ...
```

### Protect Endpoints with Roles

```python
from app.api.deps import require_role

@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    current_user = Depends(require_role(["super_admin"]))
):
    # Only super_admin can access
    ...
```

### Check Permissions in Code

```python
from app.core.permissions import has_permission

def process_flow(user_role: str, flow_id: str):
    if has_permission(user_role, "flow:execute"):
        # Execute flow
        ...
    else:
        raise PermissionError("Cannot execute flow")
```

## Frontend Integration

### Check Permissions

```typescript
import { useAuth } from '@/contexts/AuthContext';

function FlowActions() {
  const { hasPermission, canCreate, canDelete } = useAuth();

  return (
    <div>
      {canCreate('flow') && (
        <button>Create Flow</button>
      )}
      
      {hasPermission('flow:execute') && (
        <button>Execute</button>
      )}
      
      {canDelete('flow') && (
        <button>Delete</button>
      )}
    </div>
  );
}
```

### Permission Gate Component

```typescript
import { PermissionGate } from '@/components/PermissionGate';

function Dashboard() {
  return (
    <div>
      <PermissionGate permission="flow:create">
        <FlowBuilder />
      </PermissionGate>
      
      <PermissionGate widget="analytics_dashboard">
        <Analytics />
      </PermissionGate>
    </div>
  );
}
```

### Protected Routes

```typescript
import { ProtectedRoute } from '@/components/ProtectedRoute';

function App() {
  return (
    <Routes>
      <Route path="/flows/new" element={
        <ProtectedRoute requiredPermission="flow:create">
          <CreateFlowPage />
        </ProtectedRoute>
      } />
      
      <Route path="/users" element={
        <ProtectedRoute requiredPermission="user:read">
          <UsersPage />
        </ProtectedRoute>
      } />
    </Routes>
  );
}
```

## Widget System

Widgets are UI components that are shown/hidden based on permissions.

### Available Widgets

| Widget ID | Name | Required Permissions | Roles |
|-----------|------|---------------------|-------|
| `user_management` | User Management | `user:create`, `user:update` | super_admin, admin |
| `flow_builder` | Flow Builder | `flow:create` | super_admin, admin, manager, editor |
| `flow_viewer` | Flow Viewer | `flow:read` | All |
| `template_editor` | Template Editor | `template:create` | super_admin, admin, manager, editor |
| `bot_manager` | Bot Manager | `bot:create`, `bot:update` | super_admin, admin, manager |
| `channel_manager` | Channel Manager | `channel:create` | super_admin, admin, manager |
| `analytics_dashboard` | Analytics | `analytics:read` | All |
| `settings_panel` | Settings | `settings:update` | super_admin, admin |
| `integration_manager` | Integrations | `integration:create` | super_admin, admin, manager |
| `metadata_editor` | Metadata Editor | `metadata:create` | super_admin, admin, manager, editor |

## Best Practices

### 1. Always Check Permissions on Both Sides
```typescript
// Frontend
if (canDelete('flow')) {
  await deleteFlow(id);
}

// Backend
@router.delete("/flows/{id}")
async def delete_flow(
    id: str,
    user = Depends(require_permission("flow:delete"))
):
    ...
```

### 2. Use Descriptive Permission Names
```python
# Good
"flow:create"
"template:update"
"analytics:export"

# Bad
"create"
"edit"
"export"
```

### 3. Group Related Permissions
```python
FLOW_PERMISSIONS = [
    "flow:create",
    "flow:read",
    "flow:update",
    "flow:delete",
    "flow:execute"
]
```

### 4. Cache Capabilities in Frontend
```typescript
const { capabilities } = useAuth();
// Capabilities are fetched once and cached
```

### 5. Log Permission Denials
```python
if not has_permission(user_role, required_permission):
    logger.warning(
        f"Permission denied: {user_id} tried to access {required_permission}"
    )
    raise HTTPException(status_code=403)
```

## Troubleshooting

### User has wrong permissions
1. Check user's role (tag field) in Casdoor
2. Verify ROLE_PERMISSIONS mapping in `app/core/permissions.py`
3. Check JWT token payload contains correct role

### Permission check always fails
1. Verify JWT token is valid
2. Check Authorization header format: `Bearer <token>`
3. Ensure role is extracted correctly from JWT

### Widget not showing
1. Check user capabilities: `GET /api/v1/permissions/me/capabilities`
2. Verify widget ID matches backend definition
3. Check required_permissions for widget

## References

- [RBAC Wikipedia](https://en.wikipedia.org/wiki/Role-based_access_control)
- [OAuth 2.0 Scopes](https://oauth.net/2/scope/)
- [FastAPI Security](https://fastapi.tiangolo.com/tutorial/security/)
