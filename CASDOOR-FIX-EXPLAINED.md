# Casdoor Integration Fix - Explained

## The Problem

Your logs showed:
```
[AuthCasdoorService]   - casdoorUser.isAdmin: undefined
[AuthCasdoorService]   - casdoorUser.isGlobalAdmin: undefined
[AuthCasdoorService]   - casdoorUser.type: undefined
[AuthCasdoorService]   - casdoorUser.roles: undefined
```

All user fields were `undefined` because you were calling the wrong API endpoint.

## Root Cause

You were calling `/api/userinfo` which returns an **OIDC-compliant Userinfo object** (limited fields):
```typescript
{
  sub: "wataomi/admin",
  iss: "http://localhost:8030",
  aud: "wataomi-app",
  name: "admin",
  email: "admin@wataomi.com",
  // ... only basic OIDC fields
}
```

This endpoint does NOT include:
- `isAdmin` (boolean)
- `tag` (string - your role field)
- `type` (string)
- Full `roles` array
- Full `permissions` array

## The Solution

Now the code calls **TWO endpoints**:

### 1. `/api/userinfo` (first)
- Get basic user info and the user ID
- Returns: `{ sub: "owner/name", name: "...", email: "..." }`

### 2. `/api/get-user?id=owner/name` (second)
- Get the **FULL user object** from Casdoor
- Returns the complete User struct with ALL fields:
  ```typescript
  {
    owner: "wataomi",
    name: "admin",
    email: "admin@wataomi.com",
    isAdmin: true,           // ✅ Now available!
    tag: "super_admin",      // ✅ Now available!
    type: "normal-user",     // ✅ Now available!
    roles: [...],            // ✅ Now available!
    permissions: [...],      // ✅ Now available!
    // ... 100+ other fields
  }
  ```

## Role Mapping Logic

The updated code checks roles in this priority order:

1. **`isAdmin` field** (boolean) - Direct admin flag
2. **`tag` field** (string) - The role you set in Casdoor UI
   - `super_admin` → admin
   - `admin` → admin
   - `manager` → user
   - `editor` → user
   - etc.
3. **`roles` array** - Array of role objects
4. **`type` field** - User type

## What Changed in the Code

### Before:
```typescript
private async getCasdoorUserInfo(accessToken: string): Promise<any> {
  const userInfoUrl = `${this.casdoorEndpoint}/api/userinfo`;
  // Only called /api/userinfo - limited fields
}
```

### After:
```typescript
private async getCasdoorUserInfo(accessToken: string): Promise<any> {
  // 1. Get basic info from /api/userinfo
  const userInfo = await fetch(`${this.casdoorEndpoint}/api/userinfo`);
  
  // 2. Get full user from /api/get-user
  const userId = userInfo.sub; // e.g., "wataomi/admin"
  const fullUser = await fetch(`${this.casdoorEndpoint}/api/get-user?id=${userId}`);
  
  return fullUser.data; // Full user object with all fields
}
```

## Testing

Now when you login, you should see in the logs:

```
[AuthCasdoorService] Basic userinfo: {"sub":"wataomi/admin","name":"admin",...}
[AuthCasdoorService] Full user data: {"owner":"wataomi","name":"admin","isAdmin":true,"tag":"super_admin",...}
[AuthCasdoorService] Checking admin status:
[AuthCasdoorService]   - casdoorUser.isAdmin: true
[AuthCasdoorService]   - casdoorUser.tag: super_admin
[AuthCasdoorService]   - casdoorUser.type: normal-user
[AuthCasdoorService]   - casdoorUser.roles: [...]
[AuthCasdoorService] User is admin via isAdmin field
[AuthCasdoorService] Final determination - isAdmin: true, roleId: 1
```

## Casdoor User Fields Reference

Based on the Casdoor source code (`services/casdoor/object/user.go`):

```go
type User struct {
    Owner       string  // Organization name
    Name        string  // Username
    Email       string
    IsAdmin     bool    // Admin flag
    Tag         string  // Custom role tag (what you set in UI)
    Type        string  // User type
    Roles       []*Role // Array of role objects
    Permissions []*Permission // Array of permission objects
    // ... 100+ more fields
}
```

## Next Steps

1. Restart your backend server
2. Clear browser cache/cookies
3. Login again through Casdoor
4. Check the logs - you should now see all user fields populated
5. Verify that admin users get `roleId: 1` and regular users get `roleId: 2`

## References

- Casdoor User struct: `services/casdoor/object/user.go` (line 54)
- Casdoor API endpoints: `services/casdoor/controllers/user.go` (line 146)
- Userinfo endpoint: `services/casdoor/controllers/account.go` (line 587)
