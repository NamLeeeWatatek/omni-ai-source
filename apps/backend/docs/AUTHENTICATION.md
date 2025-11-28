# Authentication Guide

## Overview

WataOmi uses [Casdoor](https://casdoor.org/) for authentication and user management. Casdoor provides OAuth 2.0 authentication with support for multiple identity providers.

## Architecture

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   Frontend  │─────►│   Backend   │─────►│   Casdoor   │
│   (React)   │◄─────│  (FastAPI)  │◄─────│   (OAuth)   │
└─────────────┘      └─────────────┘      └─────────────┘
```

## Setup Casdoor

### 1. Start Casdoor

Using Docker:
```bash
docker-compose up -d casdoor
```

Or standalone:
```bash
docker run -d \
  --name casdoor \
  -p 8030:8000 \
  casbin/casdoor:latest
```

### 2. Access Casdoor UI

Open http://localhost:8030

Default credentials:
- Username: `admin`
- Password: `123`

### 3. Create Organization

1. Go to **Organizations** → Click **Add**
2. Fill in:
   - Name: `wataomi`
   - Display name: `WataOmi`
   - Website URL: `http://localhost:3000`
3. Enable:
   - ✅ Enable password
   - ✅ Enable signup
   - ✅ Enable signin
4. Click **Save**

### 4. Create Application

1. Go to **Applications** → Click **Add**
2. Fill in:
   - Name: `wataomi-app`
   - Display name: `WataOmi App`
   - Organization: `wataomi`
   - Homepage URL: `http://localhost:3000`
3. Configure OAuth:
   - Redirect URLs:
     ```
     http://localhost:3000/auth/callback
     http://localhost:8000/api/v1/auth/callback
     ```
   - Token format: `JWT`
   - Token expire in: `168` (hours)
   - Refresh token expire in: `720` (hours)
4. Enable Grant types:
   - ✅ authorization_code
   - ✅ refresh_token
5. Click **Save**
6. **Copy** Client ID and Client Secret

### 5. Configure Backend

Update `.env`:
```env
CASDOOR_ENDPOINT=http://localhost:8030
CASDOOR_ORG_NAME=wataomi
CASDOOR_APP_NAME=wataomi-app
CASDOOR_CLIENT_ID=<your_client_id>
CASDOOR_CLIENT_SECRET=<your_client_secret>
CASDOOR_CERTIFICATE=<your_certificate>
```

## Authentication Flow

### 1. Login Flow

```
1. User clicks "Login" in Frontend
2. Frontend calls GET /api/v1/casdoor/auth/login/url
3. Backend returns Casdoor OAuth URL
4. Frontend redirects user to Casdoor
5. User logs in on Casdoor
6. Casdoor redirects back with authorization code
7. Frontend calls POST /api/v1/casdoor/auth/callback with code
8. Backend exchanges code for Casdoor token
9. Backend extracts user info + role from JWT
10. Backend creates own JWT with permissions
11. Backend returns JWT + user info to Frontend
12. Frontend stores JWT in localStorage
```

### 2. API Request Flow

```
1. Frontend includes JWT in Authorization header
2. Backend validates JWT signature
3. Backend extracts user info and role
4. Backend checks permissions
5. Backend processes request
6. Backend returns response
```

### 3. Token Refresh Flow

```
1. Access token expires
2. Frontend calls POST /api/v1/casdoor/auth/refresh
3. Backend validates refresh token
4. Backend creates new access token
5. Backend returns new token
6. Frontend updates stored token
```

## API Endpoints

### Get Login URL

```http
GET /api/v1/casdoor/auth/login/url

Response:
{
  "url": "http://localhost:8030/login/oauth/authorize?...",
  "redirect_uri": "http://localhost:3000/auth/callback"
}
```

### Handle OAuth Callback

```http
POST /api/v1/casdoor/auth/callback
Content-Type: application/json

{
  "code": "authorization_code_from_casdoor",
  "state": "random_state"
}

Response:
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer",
  "expires_in": 1800,
  "refresh_token": "eyJhbGc...",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "User Name",
    "role": "manager",
    "permissions": ["flow:create", "flow:read", ...]
  }
}
```

### Get Current User

```http
GET /api/v1/casdoor/auth/me
Authorization: Bearer <access_token>

Response:
{
  "id": "user_id",
  "email": "user@example.com",
  "name": "User Name",
  "role": "manager",
  "permissions": ["flow:create", "flow:read", ...]
}
```

### Refresh Token

```http
POST /api/v1/casdoor/auth/refresh
Content-Type: application/json

{
  "refresh_token": "eyJhbGc..."
}

Response:
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer",
  "expires_in": 1800,
  "user": {...}
}
```

### Logout

```http
POST /api/v1/casdoor/auth/logout
Authorization: Bearer <access_token>

Response:
{
  "message": "Logged out successfully"
}
```

## JWT Token Structure

### Access Token Payload

```json
{
  "sub": "user_id",
  "email": "user@example.com",
  "name": "User Name",
  "role": "manager",
  "permissions": ["flow:create", "flow:read", ...],
  "exp": 1234567890,
  "iat": 1234567890,
  "type": "access"
}
```

### Refresh Token Payload

```json
{
  "sub": "user_id",
  "exp": 1234567890,
  "iat": 1234567890,
  "type": "refresh"
}
```

## User Management

### Create Users in Casdoor

1. Go to **Users** → Click **Add**
2. Fill in:
   - Organization: `wataomi`
   - Name: `username`
   - Display name: `Full Name`
   - Email: `user@example.com`
   - Password: `SecurePassword123`
   - Phone: `+84901234567`
   - Tag: `manager` (this is the role!)
3. For admin users, enable:
   - ✅ Is admin
4. Click **Save**

### User Roles

Set the user's role in the **Tag** field:

- `super_admin` - Full system access
- `admin` - Organization admin
- `manager` - Campaign manager
- `editor` - Content editor
- `viewer` - Read-only access
- `user` - Basic user

## Security Best Practices

1. **Use HTTPS in production**
2. **Store tokens securely** (httpOnly cookies or secure storage)
3. **Implement token refresh** before expiration
4. **Validate tokens on every request**
5. **Use strong JWT secrets**
6. **Implement rate limiting**
7. **Log authentication events**
8. **Implement CSRF protection**
9. **Use secure password policies**
10. **Enable MFA for admin users**

## Troubleshooting

### "Invalid client credentials"
- Check CASDOOR_CLIENT_ID and CASDOOR_CLIENT_SECRET in .env
- Verify they match the values in Casdoor application settings

### "Redirect URI mismatch"
- Ensure redirect URI in frontend matches Casdoor application settings
- Check for trailing slashes

### "Token expired"
- Implement token refresh logic
- Check token expiration times in Casdoor settings

### "Permission denied"
- Verify user's role (tag field) in Casdoor
- Check ROLE_PERMISSIONS mapping in backend

### "CORS errors"
- Add frontend URL to CORS allowed origins
- Check CORS middleware configuration

## Testing

### Test Login Flow

```bash
# 1. Get login URL
curl http://localhost:8000/api/v1/casdoor/auth/login/url

# 2. Open URL in browser and login

# 3. Exchange code for token
curl -X POST http://localhost:8000/api/v1/casdoor/auth/callback \
  -H "Content-Type: application/json" \
  -d '{"code": "authorization_code"}'

# 4. Test authenticated endpoint
curl http://localhost:8000/api/v1/casdoor/auth/me \
  -H "Authorization: Bearer <access_token>"
```

## References

- [Casdoor Documentation](https://casdoor.org/docs/overview)
- [OAuth 2.0 Specification](https://oauth.net/2/)
- [JWT.io](https://jwt.io/)
