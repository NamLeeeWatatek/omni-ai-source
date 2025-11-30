# Environment Variables for OAuth

Add these to your `.env` file:

```bash
# Facebook OAuth
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
FACEBOOK_REDIRECT_URI=http://localhost:3000/v1/oauth/callback/facebook

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/v1/oauth/callback/google
```

## Setup Instructions

### Facebook App Setup

1. Go to https://developers.facebook.com/apps
2. Create a new app (Business type)
3. Add "Facebook Login" product
4. Configure OAuth Redirect URIs:
   - `http://localhost:3000/v1/oauth/callback/facebook`
   - `https://yourdomain.com/v1/oauth/callback/facebook` (production)
5. Request permissions:
   - `pages_show_list`
   - `pages_messaging`
   - `pages_manage_metadata`
   - `pages_read_engagement`
6. Copy App ID and App Secret to `.env`

### Google Business Messages Setup

1. Go to https://console.cloud.google.com
2. Create a new project
3. Enable "Business Messages API"
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:3000/v1/oauth/callback/google`
   - `https://yourdomain.com/v1/oauth/callback/google` (production)
6. Copy Client ID and Client Secret to `.env`

## Testing OAuth Flow

### Test Facebook Connection

1. Navigate to http://localhost:3001/channels (frontend)
2. Click "Connect" on Facebook card
3. Frontend should call: `GET /v1/oauth/login/facebook`
4. Open returned URL in popup
5. User logs in to Facebook
6. User grants permissions
7. Facebook redirects to `/v1/oauth/callback/facebook?code=...`
8. Backend exchanges code for access token
9. Backend fetches user's Facebook Pages
10. Backend creates `ChannelConnectionEntity` for each page
11. Popup closes and notifies parent window
12. Frontend refreshes channel list

### Test Google Connection

Same flow as Facebook but with Google endpoints.

## Frontend Integration

Update your channels page to use OAuth:

```typescript
const connectChannel = async (provider: string) => {
  // Get OAuth URL
  const { url } = await fetch(`/v1/oauth/login/${provider}`).then(r => r.json());
  
  // Open popup
  const popup = window.open(url, 'oauth', 'width=600,height=700');
  
  // Listen for success message
  window.addEventListener('message', (event) => {
    if (event.data.status === 'success') {
      console.log('Connected!', event.data);
      // Refresh channel list
      loadChannels();
    }
  });
};
```
