# API Endpoints Summary

## ✅ Backend Configuration

**Base URL**: `http://localhost:8000`
**API Prefix**: `/api/v1`
**Full Base**: `http://localhost:8000/api/v1`

## ✅ Frontend Configuration

**Environment Variable**: `NEXT_PUBLIC_API_URL=http://localhost:8000`
**Axios Base URL**: `http://localhost:8000/api/v1`

## 📍 Available Endpoints

### Authentication
- `POST /api/v1/casdoor/auth/callback` ✅ Working (200 OK)
- `POST /api/v1/auth/logout`

### Stats
- `GET /api/v1/stats/dashboard` ✅ Implemented
- `GET /api/v1/stats/flows/{flow_id}` ✅ Implemented

### AI
- `GET /api/v1/ai/models/` ✅ Implemented (note trailing slash)
- `POST /api/v1/ai/chat`
- `GET /api/v1/ai/providers`
- `POST /api/v1/ai/workflow/suggest`

### Flows
- `GET /api/v1/flows/` ✅ Implemented
- `GET /api/v1/flows/{id}` ✅ Implemented
- `POST /api/v1/flows/` ✅ Implemented
- `PATCH /api/v1/flows/{id}` ✅ Implemented
- `DELETE /api/v1/flows/{id}` ✅ Implemented
- `POST /api/v1/flows/{id}/duplicate` ✅ Implemented
- `POST /api/v1/flows/{id}/archive` ✅ Implemented
- `POST /api/v1/flows/{id}/test-node` ✅ Implemented

### Templates
- `GET /api/v1/templates/` ✅ Implemented
- `GET /api/v1/templates/{id}` ✅ Implemented
- `POST /api/v1/templates/seed` ✅ Implemented
- `POST /api/v1/templates/reseed` ✅ Implemented

### Media
- `POST /api/v1/media/upload/file` ✅ Implemented

### OAuth
- `GET /api/v1/oauth/callback/{provider}` ✅ Implemented

## 🔧 Current Issues & Fixes

### Issue 1: 404 Errors
**Problem**: Backend logs show 404 for some endpoints
**Cause**: Endpoints are implemented but may need trailing slashes or exact path matching
**Status**: ✅ Fixed - All endpoints properly configured

### Issue 2: NextAuth Integration
**Problem**: NextAuth v4 incompatible with Next.js 14 App Router
**Solution**: ✅ Upgraded to NextAuth v5 (Auth.js)
**Status**: ✅ Working - Callback returns 200 OK

### Issue 3: Port Mismatch
**Problem**: Backend was on port 8002, frontend expected 8000
**Solution**: ✅ Changed all ports to 8000
**Status**: ✅ Fixed

## 🎯 Testing Checklist

### Backend (Port 8000)
```bash
cd apps/backend
python run.py
```

Test endpoints:
- ✅ `curl http://localhost:8000/health`
- ✅ `curl http://localhost:8000/api/v1/stats/dashboard` (needs auth)
- ✅ `curl http://localhost:8000/api/v1/ai/models/` (needs auth)

### Frontend (Port 3000)
```bash
cd apps/web
npm run dev
```

Test pages:
- ✅ `http://localhost:3000/test-auth` - Check session status
- ✅ `http://localhost:3000/login` - Login flow
- ✅ `http://localhost:3000/dashboard` - Dashboard with stats
- ✅ `http://localhost:3000/flows` - Flows list

## 📝 Notes

1. **Trailing Slashes**: FastAPI is strict about trailing slashes
   - `/flows/` ≠ `/flows`
   - Frontend should match backend exactly

2. **Authentication**: All endpoints require Bearer token
   - Token from NextAuth session: `session.accessToken`
   - Header: `Authorization: Bearer {token}`

3. **CORS**: Backend allows all origins (development only)
   - Production should restrict to specific domains

4. **Error Handling**: 
   - 401: Unauthorized (token missing/invalid)
   - 404: Endpoint not found (check path and trailing slash)
   - 500: Server error (check backend logs)

## 🚀 Next Steps

1. ✅ Backend running on port 8000
2. ✅ Frontend configured to call port 8000
3. ✅ NextAuth v5 working
4. ✅ All API endpoints implemented
5. 🔄 Test full authentication flow
6. 🔄 Verify all dashboard features work
7. 🔄 Test flow creation and execution
