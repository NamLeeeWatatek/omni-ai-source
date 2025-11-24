# Casdoor Login Integration Guide

## Overview
The Casdoor login flow has been successfully integrated into the WataOmi application. This document explains how the authentication works and what you need to configure.

## Flow Diagram

```
User clicks "Sign in" 
    ↓
Frontend redirects to Casdoor login page
    ↓
User authenticates with Casdoor
    ↓
Casdoor redirects back to /callback with code
    ↓
Frontend sends code to backend /api/v1/auth/casdoor/login
    ↓
Backend exchanges code for token with Casdoor
    ↓
Backend returns token to frontend
    ↓
Frontend stores token and redirects to /dashboard
```

## Files Modified/Created

### Backend
1. **`apps/backend/app/api/v1/auth.py`**
   - Added `/casdoor/login` endpoint
   - Accepts `code` from Casdoor callback
   - Exchanges code for access token
   - Returns token and user info to frontend

2. **`apps/backend/app/core/auth.py`** (already existed)
   - Contains `AuthService` with Casdoor SDK integration
   - Handles token verification

### Frontend
1. **`apps/web/app/login/page.tsx`** (NEW)
   - Login page with Casdoor button
   - Redirects to Casdoor login URL
   - Beautiful UI with WataOmi branding

2. **`apps/web/app/callback/page.tsx`** (UPDATED)
   - Handles OAuth callback from Casdoor
   - Extracts `code` from URL
   - Calls backend API to exchange code for token
   - Stores token in localStorage
   - Redirects to dashboard

3. **`apps/web/lib/casdoor.ts`** (already existed)
   - Casdoor SDK configuration
   - Generates login URLs

## Environment Variables Required

### Backend (`apps/backend/.env`)
```env
CASDOOR_ENDPOINT=https://your-casdoor-instance.com
CASDOOR_CLIENT_ID=your_client_id
CASDOOR_CLIENT_SECRET=your_client_secret
CASDOOR_CERTIFICATE=your_certificate_content
CASDOOR_ORG_NAME=your_org_name
CASDOOR_APP_NAME=your_app_name
```

### Frontend (`apps/web/.env.local`)
```env
NEXT_PUBLIC_CASDOOR_ENDPOINT=https://your-casdoor-instance.com
NEXT_PUBLIC_CASDOOR_CLIENT_ID=your_client_id
NEXT_PUBLIC_CASDOOR_ORG_NAME=your_org_name
NEXT_PUBLIC_CASDOOR_APP_NAME=your_app_name
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

## Casdoor Configuration

In your Casdoor admin panel, you need to:

1. **Create an Application** (if not already done)
   - Name: WataOmi (or your app name)
   - Organization: Your organization name
   - Client ID: Generate or use existing
   - Client Secret: Generate or use existing

2. **Configure Redirect URLs**
   - Add `http://localhost:3001/callback` for development
   - Add your production callback URL for production

3. **Get Certificate**
   - Copy the certificate from Casdoor application settings
   - Paste into `CASDOOR_CERTIFICATE` environment variable

## Testing the Flow

1. **Start the backend**:
   ```bash
   cd apps/backend
   npm run dev
   ```

2. **Start the frontend**:
   ```bash
   cd apps/web
   npm run dev
   ```

3. **Test login**:
   - Navigate to `http://localhost:3001/login`
   - Click "Sign in with Casdoor"
   - You should be redirected to Casdoor
   - After login, you'll be redirected back to `/callback`
   - The callback page will exchange the code for a token
   - You'll be redirected to `/dashboard`

## API Endpoints

### POST `/api/v1/auth/casdoor/login`
**Request:**
```json
{
  "code": "authorization_code_from_casdoor",
  "state": "optional_state_parameter"
}
```

**Response:**
```json
{
  "access_token": "jwt_token",
  "token_type": "bearer",
  "user": {
    "id": "user_id",
    "name": "User Name",
    "email": "user@example.com"
  },
  "workspace": {
    "id": 1,
    "name": "Default Workspace"
  }
}
```

## Token Storage

The frontend stores the token in `localStorage`:
- Key: `wataomi_token`
- Value: JWT token from Casdoor

The token is automatically included in API requests via the `fetchAPI` helper in `apps/web/lib/api.ts`.

## Next Steps

1. **Configure your Casdoor instance** with the correct redirect URLs
2. **Update environment variables** with your actual Casdoor credentials
3. **Test the login flow** end-to-end
4. **Implement token refresh** (optional, for long-lived sessions)
5. **Add logout functionality** (clear localStorage and redirect to login)

## Troubleshooting

### "Failed to get token from Casdoor"
- Check that `CASDOOR_CLIENT_ID` and `CASDOOR_CLIENT_SECRET` are correct
- Verify the redirect URL in Casdoor matches your callback URL
- Check backend logs for detailed error messages

### "Invalid token received from Casdoor"
- Verify `CASDOOR_CERTIFICATE` is correctly set
- Check that the certificate matches your Casdoor application

### Redirect loop
- Clear localStorage: `localStorage.clear()`
- Check that callback URL is correctly configured in Casdoor
- Verify `NEXT_PUBLIC_APP_URL` is set correctly

## Security Notes

- Never commit `.env` files to version control
- Use HTTPS in production
- Implement CSRF protection for production
- Consider using HTTP-only cookies instead of localStorage for token storage in production
- Implement token expiration and refresh logic
