# Permission Components

Hệ thống phân quyền RBAC (Role-Based Access Control) cho frontend.

## Roles

- **super_admin**: Toàn quyền
- **admin**: Quản trị viên
- **manager**: Quản lý
- **editor**: Biên tập viên
- **viewer**: Chỉ xem
- **user**: Người dùng thường

## Components

### 1. RoleBadge
Hiển thị role của user với màu sắc phù hợp.

```tsx
import { RoleBadge } from '@/components/auth/RoleBadge'

<RoleBadge /> // Hiển thị role của user hiện tại
<RoleBadge role="admin" /> // Hiển thị role cụ thể
```

### 2. PermissionGate
Ẩn/hiện component dựa trên quyền.

```tsx
import { PermissionGate, CanCreate, CanDelete, AdminOnly } from '@/components/auth/PermissionGate'

// Kiểm tra quyền tạo flow
<CanCreate resource="flow">
  <Button>Create Flow</Button>
</CanCreate>

// Kiểm tra quyền xóa template
<CanDelete resource="template">
  <Button>Delete</Button>
</CanDelete>

// Chỉ admin mới thấy
<AdminOnly>
  <SettingsPanel />
</AdminOnly>

// Kiểm tra nhiều quyền
<PermissionGate 
  permissions={['flow:update', 'flow:delete']} 
  requireAll={false} // Chỉ cần 1 trong 2
  fallback={<p>Không có quyền</p>}
>
  <EditButton />
</PermissionGate>
```

### 3. PermissionButton
Button tự động disable/ẩn dựa trên quyền.

```tsx
import { PermissionButton } from '@/components/auth/PermissionButton'

<PermissionButton
  resource="flow"
  action="delete"
  variant="destructive"
  hideIfNoPermission // Ẩn thay vì disable
  onClick={handleDelete}
>
  Delete
</PermissionButton>
```

### 4. usePermissions Hook
Hook để kiểm tra quyền trong code.

```tsx
import { usePermissions } from '@/lib/hooks/usePermissions'

function MyComponent() {
  const {
    capabilities,
    hasPermission,
    canCreate,
    canUpdate,
    canDelete,
    isAdmin,
    canAccessWidget,
  } = usePermissions()

  if (canCreate('flow')) {
    // Hiển thị nút tạo flow
  }

  if (isAdmin()) {
    // Hiển thị admin panel
  }

  if (canAccessWidget('analytics_dashboard')) {
    // Hiển thị analytics widget
  }
}
```

## Resources

- `user` - Quản lý người dùng
- `flow` - Workflows
- `template` - Templates
- `bot` - Bots
- `channel` - Channels
- `integration` - Integrations
- `settings` - Cài đặt
- `analytics` - Phân tích
- `metadata` - Metadata

## Actions

- `create` - Tạo mới
- `read` - Xem
- `update` - Cập nhật
- `delete` - Xóa
- `execute` - Thực thi (chỉ flow)

## Ví dụ thực tế

### Flows Page
```tsx
// Chỉ hiển thị nút Create nếu có quyền
<CanCreate resource="flow">
  <Button>Create Flow</Button>
</CanCreate>

// Dropdown menu với permission checks
<DropdownMenu>
  {canUpdate('flow') && (
    <DropdownMenuItem onClick={handleEdit}>Edit</DropdownMenuItem>
  )}
  {canDelete('flow') && (
    <DropdownMenuItem onClick={handleDelete}>Delete</DropdownMenuItem>
  )}
</DropdownMenu>
```

### Templates Page
```tsx
const { canCreate, canUpdate, canDelete } = usePermissions()

// Kiểm tra quyền trước khi hiển thị actions
{canUpdate('template') && (
  <Button onClick={handleEdit}>Edit</Button>
)}

{canDelete('template') && (
  <Button onClick={handleDelete}>Delete</Button>
)}
```

### Layout
```tsx
// Hiển thị role badge trong user menu
<RoleBadge />

// Ẩn menu items dựa trên permissions
{canAccessWidget('settings_panel') && (
  <MenuItem href="/settings">Settings</MenuItem>
)}
```
