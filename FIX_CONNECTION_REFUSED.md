# Fix: ERR_CONNECTION_REFUSED - API Call Failed

## 🔴 Vấn Đề

Sau khi login với Casdoor, frontend gặp lỗi:
```
POST http://localhost:8000/api/v1/auth/casdoor/login net::ERR_CONNECTION_REFUSED
```

## 🔍 Nguyên Nhân

### Vấn Đề 1: Sai API URL
Frontend đang gọi **port 8000** (Casdoor server) thay vì **port 8002** (Backend API).

**Tại sao?**
- `NEXT_PUBLIC_API_URL` trong `.env.local` bị sai hoặc thiếu
- Frontend fallback về default: `http://localhost:8000`

**File**: `apps/web/lib/api.ts`
```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8002/api/v1';
```

### Vấn Đề 2: Backend .env Syntax Error
```
Python-dotenv could not parse statement starting at line 51
```

Backend không thể start vì `.env` file có lỗi syntax (thường là certificate multi-line).

## ✅ Giải Pháp

### Fix 1: Sửa Frontend API URL

#### Cách 1: Chạy Script Tự Động
```powershell
powershell -ExecutionPolicy Bypass -File fix-auth-issues.ps1
```

#### Cách 2: Sửa Thủ Công
Mở `apps/web/.env.local` và đảm bảo có dòng:
```env
NEXT_PUBLIC_API_URL=http://localhost:8002/api/v1
```

**Lưu ý:** 
- Port **8002** (backend API), KHÔNG phải 8000 (Casdoor)
- Phải có `/api/v1` ở cuối

### Fix 2: Sửa Backend .env Syntax

#### Tìm Lỗi
Mở `apps/backend/.env` và check dòng 51 (hoặc gần đó).

#### Common Issues:

**Issue A: Multi-line Certificate**
❌ **SAI:**
```env
CASDOOR_CERTIFICATE=-----BEGIN CERTIFICATE-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...
-----END CERTIFICATE-----
```

✅ **ĐÚNG:** (Tất cả trên 1 dòng)
```env
CASDOOR_CERTIFICATE=-----BEGIN CERTIFICATE-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...\n-----END CERTIFICATE-----
```

**Issue B: Spaces Around =**
❌ **SAI:**
```env
CASDOOR_CLIENT_ID = your-client-id
```

✅ **ĐÚNG:**
```env
CASDOOR_CLIENT_ID=your-client-id
```

**Issue C: Unquoted Special Characters**
❌ **SAI:**
```env
DATABASE_URL=postgresql://user:p@ssw0rd@localhost/db
```

✅ **ĐÚNG:**
```env
DATABASE_URL="postgresql://user:p@ssw0rd@localhost/db"
```

#### Quick Fix Certificate
Nếu certificate là vấn đề, có 2 cách:

**Cách 1: Escape newlines**
```env
CASDOOR_CERTIFICATE=-----BEGIN CERTIFICATE-----\nMIIBIjAN...\n-----END CERTIFICATE-----
```

**Cách 2: Use placeholder**
```env
CASDOOR_CERTIFICATE=your-certificate
```
Và update sau khi backend chạy được.

### Fix 3: Verify Configuration

#### Frontend `.env.local` phải có:
```env
# Casdoor - Base URL only (no /login)
NEXT_PUBLIC_CASDOOR_ENDPOINT=http://localhost:8030
NEXT_PUBLIC_CASDOOR_CLIENT_ID=ba9f6fd2200119536d35
NEXT_PUBLIC_CASDOOR_ORG_NAME=built-in
NEXT_PUBLIC_CASDOOR_APP_NAME=app-built-in

# Backend API - Port 8002, with /api/v1
NEXT_PUBLIC_API_URL=http://localhost:8002/api/v1
```

#### Backend `.env` phải có:
```env
# Casdoor
CASDOOR_ENDPOINT=http://localhost:8030
CASDOOR_CLIENT_ID=ba9f6fd2200119536d35
CASDOOR_CLIENT_SECRET=your-client-secret
CASDOOR_CERTIFICATE=your-certificate-on-one-line
CASDOOR_ORG_NAME=built-in
CASDOOR_APP_NAME=app-built-in
```

## 🔄 Restart Servers

**QUAN TRỌNG:** Phải restart cả 2 servers sau khi sửa .env!

```bash
# Stop current servers (Ctrl+C on both terminals)

# Terminal 1: Backend
cd apps/backend
python run.py

# Terminal 2: Frontend
cd apps/web
npm run dev
```

## ✅ Verify Fix

### 1. Check Backend Started Successfully
Backend log should show:
```
INFO:     Uvicorn running on http://0.0.0.0:8002 (Press CTRL+C to quit)
INFO:     Started server process [xxxxx]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

**NO errors about:**
- ❌ "Python-dotenv could not parse"
- ❌ "CancelledError"

### 2. Check Frontend API URL
Mở browser console (F12) tại `/login` page:
```javascript
// Should see in logs:
Casdoor Config: {
  endpoint: "http://localhost:8030",  // Casdoor server
  clientId: "ba9f6fd2200119536d35",
  ...
}
```

### 3. Test Login Flow
1. Go to `http://localhost:3003/login`
2. Click "Sign in with Casdoor"
3. Login on Casdoor
4. After redirect to `/callback`:
   - Check Network tab (F12)
   - Should see: `POST http://localhost:8002/api/v1/auth/casdoor/login`
   - Status: **200 OK** (not ERR_CONNECTION_REFUSED)

### 4. Check Response
Successful response should be:
```json
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "User Name"
  }
}
```

## 🐛 Troubleshooting

### Still Getting ERR_CONNECTION_REFUSED?

**Check 1: Backend is running?**
```bash
curl http://localhost:8002/health
# Should return: {"status":"healthy"}
```

**Check 2: Correct port?**
```bash
# Backend should be on 8002
netstat -ano | findstr :8002

# Casdoor should be on 8030 (or 8000)
netstat -ano | findstr :8030
```

**Check 3: Frontend using correct URL?**
Open browser console:
```javascript
// Check what URL frontend is using
console.log(process.env.NEXT_PUBLIC_API_URL)
// Should be: http://localhost:8002/api/v1
```

**Check 4: CORS?**
Backend `main.py` should have:
```python
allow_origins=[
    "http://localhost:3000",
    "http://localhost:3001", 
    "http://localhost:3003",  # ← Your frontend port
    ...
]
```

### Backend Won't Start?

**Error: "could not parse statement"**
1. Check `.env` file syntax
2. Look for multi-line values
3. Check for spaces around `=`
4. Quote values with special characters

**Quick test:**
```bash
# Rename .env temporarily
mv apps/backend/.env apps/backend/.env.backup

# Copy from example
cp apps/backend/.env.example apps/backend/.env

# Try start backend
cd apps/backend
python run.py

# If it works, the old .env had syntax errors
```

## 📊 Architecture Diagram

```
┌─────────────────┐
│   Browser       │
│ localhost:3003  │
└────────┬────────┘
         │
         │ Login with Casdoor
         ↓
┌─────────────────┐
│ Casdoor Server  │
│ localhost:8030  │ ← NEXT_PUBLIC_CASDOOR_ENDPOINT
└────────┬────────┘
         │
         │ OAuth callback with code
         ↓
┌─────────────────┐
│   Frontend      │
│ localhost:3003  │
│   /callback     │
└────────┬────────┘
         │
         │ POST /auth/casdoor/login
         │ with code
         ↓
┌─────────────────┐
│ Backend API     │
│ localhost:8002  │ ← NEXT_PUBLIC_API_URL
│ /api/v1/auth/   │
└─────────────────┘
```

## ✅ Checklist

- [ ] Frontend `.env.local` exists
- [ ] `NEXT_PUBLIC_API_URL=http://localhost:8002/api/v1` (port 8002)
- [ ] `NEXT_PUBLIC_CASDOOR_ENDPOINT=http://localhost:8030` (no /login)
- [ ] Backend `.env` exists
- [ ] Backend `.env` has no syntax errors
- [ ] Backend starts successfully (no parse errors)
- [ ] Backend running on port 8002
- [ ] Frontend running on port 3003
- [ ] Can access `http://localhost:8002/health`
- [ ] Login redirects to Casdoor correctly
- [ ] Callback calls correct API endpoint
- [ ] No ERR_CONNECTION_REFUSED errors

## 📝 Summary

**Root Causes:**
1. ❌ Frontend calling wrong port (8000 instead of 8002)
2. ❌ Backend .env syntax error (line 51, likely certificate)

**Solutions:**
1. ✅ Set `NEXT_PUBLIC_API_URL=http://localhost:8002/api/v1`
2. ✅ Fix backend .env syntax (escape newlines in certificate)
3. ✅ Restart both servers

**Verification:**
- Backend starts without errors
- Frontend calls `localhost:8002` (not 8000)
- Login flow completes successfully
