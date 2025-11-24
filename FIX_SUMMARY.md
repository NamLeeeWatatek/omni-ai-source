# 404 Error Fix - Summary

## Problem Identified

You were getting a 404 error when trying to access:
```
http://localhost:3003/login/oauth/authorize?client_id=&response_type=code&redirect_uri=http%3A%2F%2Flocalhost%3A3003%2Fcallback&scope=read&state=67wi9jecbvl
```

### Root Causes:
1. **Missing Environment Variables**: The `.env.local` file didn't exist in the frontend
2. **Empty client_id**: Because env vars weren't loaded, `client_id=` was empty
3. **Wrong Endpoint**: The URL pointed to `localhost:3003` (your frontend) instead of the Casdoor server
4. **No Casdoor Server**: You need a running Casdoor instance for OAuth to work

## What Was Fixed

### 1. Created Environment Configuration Files
- ✅ `apps/web/.env.example` - Frontend environment template
- ✅ `apps/backend/.env.example` - Backend environment template
- ✅ `apps/web/.env.local` - Auto-generated from example (via setup script)
- ✅ `apps/backend/.env` - Auto-generated from example (via setup script)

### 2. Enhanced Login Page
- ✅ Added configuration validation on page load
- ✅ Shows clear error messages when Casdoor is not configured
- ✅ Displays setup instructions directly in the UI
- ✅ Disables login button when configuration is invalid
- ✅ Better error handling with try-catch

### 3. Created Setup Documentation
- ✅ `CASDOOR_SETUP.md` - Comprehensive setup guide with 3 options:
  - Option 1: Use Casdoor Demo Server (quick test)
  - Option 2: Run Casdoor Locally with Docker (recommended)
  - Option 3: Disable Casdoor temporarily (for testing other features)

### 4. Created Setup Script
- ✅ `setup.ps1` - PowerShell script to automate environment file creation

## Next Steps

### To Fix the 404 Error, Choose One Option:

### Option A: Quick Test with Demo Server (Easiest)
The `.env.local` file is already configured with demo credentials. Just:
1. **Restart your servers** (important - env vars are loaded on startup)
2. Visit `http://localhost:3003/login`
3. Click "Sign in with Casdoor"
4. You'll be redirected to the Casdoor demo server

### Option B: Run Casdoor Locally (Recommended)
1. **Install Casdoor with Docker**:
   ```bash
   docker run -d --name casdoor -p 8000:8000 casbin/casdoor:latest
   ```

2. **Access Casdoor**:
   - Open: http://localhost:8000
   - Login: `admin` / `123`

3. **Create Application**:
   - Go to Applications → Add
   - Name: `wataomi`
   - Organization: `built-in`
   - Redirect URLs: `http://localhost:3003/callback`
   - Copy the Client ID and Client Secret

4. **Update Environment Variables**:
   Edit `apps/web/.env.local`:
   ```env
   NEXT_PUBLIC_CASDOOR_ENDPOINT=http://localhost:8000
   NEXT_PUBLIC_CASDOOR_CLIENT_ID=<your-client-id>
   NEXT_PUBLIC_CASDOOR_ORG_NAME=built-in
   NEXT_PUBLIC_CASDOOR_APP_NAME=wataomi
   ```

   Edit `apps/backend/.env`:
   ```env
   CASDOOR_ENDPOINT=http://localhost:8000
   CASDOOR_CLIENT_ID=<your-client-id>
   CASDOOR_CLIENT_SECRET=<your-client-secret>
   CASDOOR_CERTIFICATE=<your-certificate>
   CASDOOR_ORG_NAME=built-in
   CASDOOR_APP_NAME=wataomi
   ```

5. **Restart Servers**:
   - Stop current servers (Ctrl+C)
   - Backend: `cd apps/backend && python run.py`
   - Frontend: `cd apps/web && npm run dev`

### Option C: Test Without Casdoor
If you want to test other features first:
1. Use the mock login endpoint: `/api/v1/auth/login`
2. Or temporarily disable the Casdoor login button

## Files Modified

1. **apps/web/app/login/page.tsx**
   - Added configuration validation
   - Enhanced error handling
   - Added setup instructions UI

2. **apps/web/.env.example** (new)
   - Template for frontend environment variables

3. **apps/backend/.env.example** (new)
   - Template for backend environment variables

4. **CASDOOR_SETUP.md** (new)
   - Comprehensive setup guide

5. **setup.ps1** (new)
   - Automated setup script

## Important Notes

⚠️ **You MUST restart your servers** after creating/modifying `.env` files. Environment variables are only loaded when the application starts.

⚠️ The current `.env.local` has placeholder values. For production or serious development, you should:
- Run your own Casdoor instance
- Use proper credentials
- Never commit `.env.local` or `.env` files to git (they're already in `.gitignore`)

## Verification Steps

After restarting servers:
1. Open browser console (F12)
2. Go to `http://localhost:3003/login`
3. Check the console logs - you should see:
   - "Casdoor Config:" with all values filled
   - "Casdoor Login URL:" with a proper URL (not containing `client_id=&`)
4. If you see error messages on the page, follow the setup instructions shown

## Additional Resources

- See `CASDOOR_SETUP.md` for detailed setup instructions
- Casdoor documentation: https://casdoor.org/docs/overview
- Casdoor demo: https://door.casdoor.com
