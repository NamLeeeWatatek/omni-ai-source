# FIX: Duplicate /login in OAuth URL

## Vấn Đề
URL bị duplicate `/login`:
```
http://localhost:8030/login/login/oauth/authorize
                      ^^^^^^ ^^^^^^
                      Duplicate!
```

## Nguyên Nhân
`NEXT_PUBLIC_CASDOOR_ENDPOINT` trong `.env.local` đang có `/login` ở cuối:
```env
NEXT_PUBLIC_CASDOOR_ENDPOINT=http://localhost:8030/login  ❌ SAI
```

Casdoor SDK tự động thêm path OAuth, nên:
- Base URL: `http://localhost:8030/login`
- SDK adds: `/login/oauth/authorize`
- Result: `/login/login/oauth/authorize` ❌

## Giải Pháp

### Bước 1: Sửa `.env.local`
Mở file `apps/web/.env.local` và sửa:

**TỪ:**
```env
NEXT_PUBLIC_CASDOOR_ENDPOINT=http://localhost:8030/login
```

**THÀNH:**
```env
NEXT_PUBLIC_CASDOOR_ENDPOINT=http://localhost:8030
```

### Bước 2: Restart Frontend
```bash
# Stop current server (Ctrl+C)
npm run dev
```

### Bước 3: Test
1. Go to `http://localhost:3003/login`
2. Click "Sign in with Casdoor"
3. URL should be:
   ```
   http://localhost:8030/login/oauth/authorize?client_id=...
   ```
   (Chỉ có 1 `/login`, không duplicate)

## Cấu Hình Đúng

### Frontend `.env.local`:
```env
# Casdoor Configuration - BASE URL ONLY (no /login at end)
NEXT_PUBLIC_CASDOOR_ENDPOINT=http://localhost:8030
NEXT_PUBLIC_CASDOOR_CLIENT_ID=ba9f6fd2200119536d35
NEXT_PUBLIC_CASDOOR_ORG_NAME=built-in
NEXT_PUBLIC_CASDOOR_APP_NAME=app-built-in

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8002/api/v1
```

### Backend `.env`:
```env
# Casdoor Configuration - BASE URL ONLY
CASDOOR_ENDPOINT=http://localhost:8030
CASDOOR_CLIENT_ID=ba9f6fd2200119536d35
CASDOOR_CLIENT_SECRET=your-client-secret
CASDOOR_CERTIFICATE=your-certificate
CASDOOR_ORG_NAME=built-in
CASDOOR_APP_NAME=app-built-in
```

## Lưu Ý Quan Trọng

✅ **ĐÚNG**: Base URL không có path
```env
NEXT_PUBLIC_CASDOOR_ENDPOINT=http://localhost:8030
NEXT_PUBLIC_CASDOOR_ENDPOINT=https://door.casdoor.com
```

❌ **SAI**: Có path ở cuối
```env
NEXT_PUBLIC_CASDOOR_ENDPOINT=http://localhost:8030/login
NEXT_PUBLIC_CASDOOR_ENDPOINT=https://door.casdoor.com/api
```

## Casdoor SDK Path Logic

Casdoor SDK tự động xây dựng URLs:
```javascript
// SDK config
{
  serverUrl: 'http://localhost:8030',  // Base URL
  signinPath: '/signin',               // SDK adds this
}

// SDK generates:
// http://localhost:8030 + /login/oauth/authorize
// = http://localhost:8030/login/oauth/authorize ✅
```

Nếu serverUrl đã có `/login`:
```javascript
{
  serverUrl: 'http://localhost:8030/login',  // Already has /login
  signinPath: '/signin',
}

// SDK generates:
// http://localhost:8030/login + /login/oauth/authorize
// = http://localhost:8030/login/login/oauth/authorize ❌
```

## Quick Fix Command

Chạy lệnh này để sửa nhanh (Windows PowerShell):

```powershell
# Backup current file
Copy-Item apps\web\.env.local apps\web\.env.local.backup

# Replace the endpoint
(Get-Content apps\web\.env.local) -replace 'NEXT_PUBLIC_CASDOOR_ENDPOINT=http://localhost:8030/login', 'NEXT_PUBLIC_CASDOOR_ENDPOINT=http://localhost:8030' | Set-Content apps\web\.env.local

# Restart frontend
cd apps\web
npm run dev
```

## Verify Fix

Sau khi sửa, check console log trong login page:
```javascript
// Should see:
Casdoor Config: {
  endpoint: "http://localhost:8030",  // No /login at end ✅
  clientId: "ba9f6fd2200119536d35",
  ...
}

Casdoor Login URL: "http://localhost:8030/login/oauth/authorize?..." ✅
```

## Common Mistakes

1. ❌ `http://localhost:8030/login` - Có /login
2. ❌ `http://localhost:8030/api` - Có /api
3. ❌ `http://localhost:8030/` - Có trailing slash (OK nhưng không cần)
4. ✅ `http://localhost:8030` - ĐÚNG!
