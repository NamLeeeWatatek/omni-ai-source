# Casdoor Integration Setup Guide

## Problem
You're getting a 404 error because the Casdoor OAuth endpoint doesn't exist. This happens because:
1. The environment variables are not configured
2. You need a running Casdoor server

## Solution Options

### Option 1: Use Casdoor Demo Server (Quick Test)
Use the official Casdoor demo server for testing:

**Frontend (.env.local)**:
```env
NEXT_PUBLIC_CASDOOR_ENDPOINT=https://door.casdoor.com
NEXT_PUBLIC_CASDOOR_CLIENT_ID=014ae4bd048734ca2dea
NEXT_PUBLIC_CASDOOR_ORG_NAME=casbin
NEXT_PUBLIC_CASDOOR_APP_NAME=app-casbin
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**Backend (.env)**:
```env
CASDOOR_ENDPOINT=https://door.casdoor.com
CASDOOR_CLIENT_ID=014ae4bd048734ca2dea
CASDOOR_CLIENT_SECRET=f26a4115725867b7bb7b668c81e1f8f7fae1544d
CASDOOR_CERTIFICATE=<paste certificate here>
CASDOOR_ORG_NAME=casbin
CASDOOR_APP_NAME=app-casbin
```

### Option 2: Run Casdoor Locally (Recommended for Development)

#### Step 1: Install Casdoor with Docker
```bash
docker run -d --name casdoor \
  -p 8000:8000 \
  casbin/casdoor:latest
```

#### Step 2: Access Casdoor
1. Open http://localhost:8000
2. Login with default credentials:
   - Username: `admin`
   - Password: `123`

#### Step 3: Create an Application
1. Go to Applications
2. Click "Add" to create a new application
3. Configure:
   - **Name**: `wataomi`
   - **Organization**: `built-in`
   - **Redirect URLs**: Add `http://localhost:3003/callback`
   - **Client ID**: Copy this value
   - **Client Secret**: Copy this value

#### Step 4: Get the Certificate
1. Go to Certs
2. Find the certificate for your organization
3. Copy the certificate content

#### Step 5: Configure Environment Variables

**Frontend (.env.local)**:
```env
NEXT_PUBLIC_CASDOOR_ENDPOINT=http://localhost:8000
NEXT_PUBLIC_CASDOOR_CLIENT_ID=<your-client-id>
NEXT_PUBLIC_CASDOOR_ORG_NAME=built-in
NEXT_PUBLIC_CASDOOR_APP_NAME=wataomi
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**Backend (.env)**:
```env
CASDOOR_ENDPOINT=http://localhost:8000
CASDOOR_CLIENT_ID=<your-client-id>
CASDOOR_CLIENT_SECRET=<your-client-secret>
CASDOOR_CERTIFICATE=<your-certificate>
CASDOOR_ORG_NAME=built-in
CASDOOR_APP_NAME=wataomi
```

### Option 3: Disable Casdoor Temporarily (For Testing Other Features)

If you want to test other features without Casdoor, you can use the email/password login:

1. Comment out Casdoor login in the frontend
2. Use the `/api/v1/auth/login` endpoint instead
3. This uses mock authentication (already implemented in the backend)

## Current Issue Analysis

The error shows:
```
http://localhost:3003/login/oauth/authorize?client_id=&response_type=code...
```

Problems:
1. ❌ `client_id=` is empty → Environment variables not loaded
2. ❌ Endpoint is `localhost:3003` → Should be Casdoor server (e.g., `localhost:8000`)
3. ❌ Path `/login/oauth/authorize` doesn't exist → This should be on Casdoor server, not your app

## Quick Fix Steps

1. **Create `.env.local` file** in `apps/web/`:
   ```bash
   cp apps/web/.env.example apps/web/.env.local
   ```

2. **Create `.env` file** in `apps/backend/`:
   ```bash
   cp apps/backend/.env.example apps/backend/.env
   ```

3. **Choose one of the options above** and configure the environment variables

4. **Restart both servers**:
   - Stop the current running servers (Ctrl+C)
   - Start backend: `cd apps/backend && python run.py`
   - Start frontend: `cd apps/web && npm run dev`

5. **Test the login flow**:
   - Go to http://localhost:3003/login
   - Click "Sign in with Casdoor"
   - You should be redirected to the Casdoor login page

## Troubleshooting

### Issue: Still getting empty client_id
- Make sure `.env.local` exists in `apps/web/`
- Restart the Next.js dev server
- Check browser console for the logged config values

### Issue: CORS errors
- Add your frontend URL to Casdoor's allowed origins
- In Casdoor admin: Applications → Your App → CORS Origins → Add `http://localhost:3003`

### Issue: Certificate errors
- Make sure the certificate is properly formatted (no extra spaces/newlines)
- The certificate should start with `-----BEGIN CERTIFICATE-----`

## Next Steps

After setting up Casdoor, you should:
1. ✅ Test the complete OAuth flow
2. ✅ Implement user synchronization to local database
3. ✅ Add proper error handling
4. ✅ Implement token refresh logic
5. ✅ Add role-based access control
