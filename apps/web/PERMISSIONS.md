# Hệ thống Phân quyền (RBAC)

## Tổng quan

Frontend đã được tích hợp đầy đủ hệ thống phân quyền RBAC từ backend.

## Cấu trúc

```
apps/web/
├── lib/
│   ├── types/permissions.ts          # Type definitions
│   ├── hooks/usePermissions.ts       # Permission hook
│   └── api/permissions.ts            # API client
├── components/
│   └── auth/
│       ├── RoleBadge.tsx            # Hiển thị role
│       ├── PermissionGate.tsx       # Conditional rendering
│       ├── PermissionButton.tsx     # Button với permissions
│       └── README.md                # Hướng dẫn sử dụng
```

## Roles & Permissions

### Roles (từ cao xuống thấp)
1. **super_admin** - Toàn quyền hệ thống
2. **admin** - Quản trị viên
3. **manager** - Quản lý workflows, bots, channels
4. **editor** - Tạo và chỉnh sửa workflows
5. **viewer** - Chỉ xem
6. **user** - Người dùng cơ bản

### Permission Matrix

| Resource | super_admin | admin | manager | editor | viewer | user |
|----------|-------------|-------|---------|--------|--------|------|
| user:create | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| flow:create | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| flow:update | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| flow:delete | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| flow:execute | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| template:create | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| bot:create | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| settings:update | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| analytics:export | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

## Đã áp dụng vào

### ✅ Flows Page (`/flows`)
- Nút "Create Flow" chỉ hiện với `flow:create`
- Nút "Edit" chỉ hiện với `flow:update`
- Nút "Delete" chỉ hiện với `flow:delete`
- Dropdown menu actions dựa trên permissions

### ✅ Templates Page (`/templates`)
- Nút "Save from Workflow" chỉ hiện với `template:create`
- Edit/Duplicate chỉ hiện với `template:update`
- Delete chỉ hiện với `template:delete`

### ✅ Dashboard Layout
- Hiển thị role badge trong user menu
- Sidebar items có thể filter theo permissions (sẵn sàng)

## API Endpoints

### GET `/api/v1/permissions/me/capabilities`
Lấy toàn bộ capabilities của user hiện tại.

Response:
```json
{
  "role": "editor",
  "permissions": ["flow:create", "flow:read", ...],
  "can_create": {
    "flow": true,
    "template": true,
    "bot": false
  },
  "can_update": {...},
  "can_delete": {...},
  "widgets": {
    "flow_builder": true,
    "analytics_dashboard": true
  },
  "features": {
    "can_export_analytics": false,
    "is_admin": false
  }
}
```

### POST `/api/v1/permissions/check`
Kiểm tra permissions cụ thể.

Request:
```json
{
  "permissions": ["flow:create", "flow:delete"]
}
```

Response:
```json
{
  "has_permission": false,
  "missing_permissions": ["flow:delete"]
}
```

## Cách sử dụng

### 1. Trong Component

```tsx
import { usePermissions } from '@/lib/hooks/usePermissions'
import { CanCreate, CanDelete } from '@/components/auth/PermissionGate'

function MyPage() {
  const { canCreate, canUpdate, canDelete, isAdmin } = usePermissions()

  return (
    <div>
      {/* Cách 1: Dùng hook */}
      {canCreate('flow') && <Button>Create</Button>}
      
      {/* Cách 2: Dùng component */}
      <CanCreate resource="flow">
        <Button>Create</Button>
      </CanCreate>
      
      {/* Cách 3: Conditional trong dropdown */}
      <DropdownMenu>
        {canUpdate('flow') && <MenuItem>Edit</MenuItem>}
        {canDelete('flow') && <MenuItem>Delete</MenuItem>}
      </DropdownMenu>
    </div>
  )
}
```

### 2. Trong Dropdown Menu

```tsx
<DropdownMenuContent>
  {canUpdate('flow') && (
    <>
      <DropdownMenuItem onClick={handleEdit}>Edit</DropdownMenuItem>
      <DropdownMenuItem onClick={handleDuplicate}>Duplicate</DropdownMenuItem>
    </>
  )}
  {canDelete('flow') && (
    <>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={handleDelete}>Delete</DropdownMenuItem>
    </>
  )}
</DropdownMenuContent>
```

### 3. Ẩn toàn bộ section

```tsx
<PermissionGate 
  permissions={['settings:update']} 
  fallback={<p>Bạn không có quyền truy cập</p>}
>
  <SettingsPanel />
</PermissionGate>
```

## Testing

### Thay đổi role để test
1. Vào Casdoor admin panel
2. Chỉnh sửa user
3. Thay đổi field `role` thành: `viewer`, `editor`, `manager`, `admin`, `super_admin`
4. Logout và login lại
5. Kiểm tra UI thay đổi theo permissions

### Test cases
- [ ] Viewer không thấy nút Create/Edit/Delete
- [ ] Editor thấy Create/Edit nhưng không thấy Delete
- [ ] Manager thấy tất cả actions cho flows
- [ ] Admin thấy thêm User Management
- [ ] Super Admin thấy tất cả

## Mở rộng

### Thêm permission mới
1. Backend: Thêm vào `app/core/permissions.py`
2. Frontend: Type đã tự động sync qua API
3. Sử dụng: `hasPermission('new:permission')`

### Thêm resource mới
1. Backend: Thêm vào `Permission` enum
2. Frontend: Thêm vào `ResourceType` trong `types/permissions.ts`
3. Sử dụng: `canCreate('new_resource')`

## Notes

- Permissions được cache 5 phút (staleTime trong React Query)
- Khi user logout, cache tự động clear
- Backend API đã sẵn sàng, chỉ cần gọi
- Tất cả components đã typed đầy đủ với TypeScript
