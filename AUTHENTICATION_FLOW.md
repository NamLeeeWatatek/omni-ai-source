# Authentication Flow - Tài liệu Đầy Đủ

## 📋 Tổng Quan

Đã implement đầy đủ luồng authentication (login/logout) giữa frontend và backend với Casdoor OAuth.

## 🔄 Luồng Login

### 1. **Trang Login** (`/login`)
```
User clicks "Sign in with Casdoor"
  ↓
Frontend redirects to Casdoor OAuth URL
  ↓
User logs in on Casdoor
  ↓
Casdoor redirects back to /callback?code=xxx&state=xxx
```

**File**: `apps/web/app/login/page.tsx`
- Validate Casdoor config khi load trang
- Hiển thị error nếu thiếu env vars
- Redirect đến Casdoor signin URL

### 2. **Callback Handler** (`/callback`)
```
Receive authorization code from Casdoor
  ↓
POST /api/v1/auth/casdoor/login { code, state }
  ↓
Backend exchanges code for token
  ↓
Backend returns { access_token, user }
  ↓
Frontend saves to localStorage
  ↓
Redirect to /dashboard
```

**File**: `apps/web/app/callback/page.tsx`
- Nhận code từ URL params
- Gọi backend endpoint `/api/v1/auth/casdoor/login`
- Lưu token và user info vào localStorage
- Redirect đến dashboard

### 3. **Backend Authentication** 
**File**: `apps/backend/app/api/v1/auth.py`

**Endpoint**: `POST /api/v1/auth/casdoor/login`
```python
{
    "code": "authorization_code",
    "state": "optional_state"
}
```

**Response**:
```json
{
    "access_token": "jwt_token",
    "token_type": "bearer",
    "user": {
        "id": 1,
        "email": "user@example.com",
        "name": "User Name"
    },
    "workspace": {
        "id": 1,
        "name": "Workspace Name"
    }
}
```

## 🚪 Luồng Logout

### Frontend → Backend → Cleanup

```
User clicks "Sign Out"
  ↓
Show confirmation dialog
  ↓
Call useAuth().logout()
  ↓
POST /api/v1/auth/logout (with token)
  ↓
Clear localStorage (token, user)
  ↓
Redirect to /login
```

**File**: `apps/web/hooks/useAuth.ts`
- Gọi backend logout endpoint
- Xóa token và user từ localStorage
- Redirect về trang login

**Backend Endpoint**: `POST /api/v1/auth/logout`
```json
Response: {
    "message": "Logged out successfully"
}
```

## 🔐 Auth Protection

### Dashboard Layout Protection
**File**: `apps/web/app/(dashboard)/layout.tsx`

```typescript
useEffect(() => {
    if (!requireAuth()) {
        return  // Redirects to /login
    }
    const currentUser = getUser()
    setUser(currentUser)
}, [])
```

- Check authentication khi mount
- Redirect về /login nếu không có token
- Load user info từ localStorage
- Display real user data (name, email, avatar)

## 📁 Files Đã Tạo/Sửa

### ✅ Files Mới
1. **`apps/web/hooks/useAuth.ts`** - Auth hook
   - `getToken()` - Lấy token từ localStorage
   - `getUser()` - Lấy user info từ localStorage
   - `isAuthenticated()` - Check có token không
   - `login(token, user)` - Lưu auth data
   - `logout()` - Clear auth và redirect
   - `requireAuth()` - Protect routes

### ✅ Files Đã Sửa
1. **`apps/web/app/(dashboard)/layout.tsx`**
   - Import và sử dụng `useAuth` hook
   - Check authentication on mount
   - Display real user info (không còn hardcode "John Doe")
   - Implement working logout button
   - Show user initial in avatar

2. **`apps/backend/app/api/v1/auth.py`**
   - Thêm `POST /logout` endpoint
   - Return success message

3. **`apps/web/app/login/page.tsx`** (đã sửa trước đó)
   - Validate Casdoor configuration
   - Show setup instructions khi thiếu config

4. **`apps/web/app/callback/page.tsx`** (đã có sẵn)
   - Handle OAuth callback
   - Exchange code for token

## 🔌 API Endpoints

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/v1/auth/casdoor/login` | Login with Casdoor code | No |
| POST | `/api/v1/auth/login` | Login with email/password (mock) | No |
| POST | `/api/v1/auth/register` | Register new user (mock) | No |
| POST | `/api/v1/auth/logout` | Logout user | Yes |
| GET | `/api/v1/auth/me` | Get current user | Yes |
| POST | `/api/v1/auth/refresh` | Refresh access token | No |

## 🧪 Testing

### Test Login Flow
1. Đảm bảo Casdoor đã được config (xem `CASDOOR_SETUP.md`)
2. Restart cả frontend và backend
3. Mở `http://localhost:3003/login`
4. Click "Sign in with Casdoor"
5. Login trên Casdoor
6. Sẽ redirect về dashboard với user info thật

### Test Logout Flow
1. Khi đã login, vào dashboard
2. Click "Sign Out" button ở sidebar
3. Confirm dialog
4. Sẽ redirect về `/login`
5. Check localStorage - token và user đã bị xóa
6. Try access `/dashboard` - sẽ redirect về `/login`

### Test Auth Protection
1. Clear localStorage (F12 → Application → Local Storage → Clear)
2. Try access `http://localhost:3003/dashboard`
3. Sẽ tự động redirect về `/login`

## 🔧 Environment Variables

### Frontend (`.env.local`)
```env
NEXT_PUBLIC_CASDOOR_ENDPOINT=http://localhost:8000
NEXT_PUBLIC_CASDOOR_CLIENT_ID=your-client-id
NEXT_PUBLIC_CASDOOR_ORG_NAME=built-in
NEXT_PUBLIC_CASDOOR_APP_NAME=wataomi
NEXT_PUBLIC_API_URL=http://localhost:8002/api/v1
```

### Backend (`.env`)
```env
CASDOOR_ENDPOINT=http://localhost:8000
CASDOOR_CLIENT_ID=your-client-id
CASDOOR_CLIENT_SECRET=your-client-secret
CASDOOR_CERTIFICATE=your-certificate
CASDOOR_ORG_NAME=built-in
CASDOOR_APP_NAME=wataomi
```

## 📊 Data Flow Diagram

```
┌─────────────┐
│   Browser   │
│  /login     │
└──────┬──────┘
       │ Click login
       ↓
┌─────────────┐
│  Casdoor    │
│  Server     │
└──────┬──────┘
       │ OAuth redirect
       ↓
┌─────────────┐
│  /callback  │
│  Frontend   │
└──────┬──────┘
       │ POST code
       ↓
┌─────────────┐
│  Backend    │
│  /auth/     │
│  casdoor/   │
│  login      │
└──────┬──────┘
       │ Return token + user
       ↓
┌─────────────┐
│ localStorage│
│ - token     │
│ - user      │
└──────┬──────┘
       │
       ↓
┌─────────────┐
│ /dashboard  │
│ (Protected) │
└─────────────┘
```

## 🎯 Next Steps (Tùy Chọn)

### Cải Tiến Có Thể Làm:
1. ✅ **Token Refresh** - Auto refresh token khi hết hạn
2. ✅ **Remember Me** - Lưu token lâu hơn
3. ✅ **Session Management** - Track active sessions
4. ✅ **Role-Based Access Control** - Phân quyền user
5. ✅ **Multi-workspace** - Support nhiều workspace
6. ✅ **2FA** - Two-factor authentication
7. ✅ **Activity Log** - Log login/logout activities

### Security Improvements:
1. ✅ **HTTP-only Cookies** - Thay vì localStorage (safer)
2. ✅ **CSRF Protection** - Prevent CSRF attacks
3. ✅ **Rate Limiting** - Limit login attempts
4. ✅ **Token Blacklist** - Revoke tokens on logout
5. ✅ **Secure Headers** - Add security headers

## 🐛 Troubleshooting

### Issue: Redirect loop /login ↔ /dashboard
**Cause**: Token exists but invalid
**Fix**: Clear localStorage và login lại

### Issue: "401 Unauthorized" khi gọi API
**Cause**: Token expired hoặc invalid
**Fix**: Logout và login lại

### Issue: User info không hiển thị
**Cause**: User object không được lưu đúng format
**Fix**: Check console.log trong callback page

### Issue: Logout không work
**Cause**: onClick handler không được gọi
**Fix**: Check browser console for errors

## 📝 Notes

- **Token Storage**: Hiện tại dùng localStorage (dễ implement nhưng less secure)
- **Token Expiry**: Chưa implement auto-refresh
- **Backend Auth**: Hiện tại backend chưa verify token thật (TODO)
- **Workspace**: Hardcoded "My Workspace" (TODO: load from backend)
- **Avatar**: Hiện dùng initial letter (TODO: support avatar upload)

## ✅ Checklist

- [x] Login page với Casdoor integration
- [x] Callback handler exchange code for token
- [x] Save token và user to localStorage
- [x] Dashboard layout check authentication
- [x] Display real user info from localStorage
- [x] Logout button với confirmation
- [x] Clear localStorage on logout
- [x] Redirect to /login after logout
- [x] Backend logout endpoint
- [x] Auth hook (useAuth) với đầy đủ functions
- [x] Route protection (requireAuth)
- [x] Error handling và user feedback
