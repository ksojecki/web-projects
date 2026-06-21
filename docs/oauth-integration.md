# OAuth 2.0 Integration Guide

This document describes the OAuth 2.0 authentication implementation for Google, Apple, and Facebook Sign In.

## Overview

The system implements a complete OAuth 2.0 flow with PKCE (Proof Key for Code Exchange) for secure authentication across multiple third-party providers.

### Architecture

- **Backend (Fastify)**: OAuth plugin entrypoint (`projects/rod-manager/apps/api/src/app/plugins/oauth/index.ts`) with modular implementation in `projects/rod-manager/apps/api/src/app/plugins/oauth/`
- **Database**: SQLite `oauth_providers` table stores provider credentials per user
- **Frontend (React)**: OAuth initiation on login page with callback handler
- **Session Management**: Standard session cookie created after OAuth callback

## Setup

### 1. Environment Variables

Configure provider credentials in your `.env` file:

```bash
# Google OAuth 2.0
OAUTH_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
OAUTH_GOOGLE_CLIENT_SECRET=your-google-client-secret

# Apple Sign In
OAUTH_APPLE_CLIENT_ID=com.yourcompany.appname
OAUTH_APPLE_CLIENT_SECRET=your-apple-key-content
OAUTH_APPLE_TEAM_ID=your-apple-team-id

# Facebook
OAUTH_FACEBOOK_CLIENT_ID=your-facebook-app-id
OAUTH_FACEBOOK_CLIENT_SECRET=your-facebook-app-secret

# Base URL for OAuth callbacks
OAUTH_REDIRECT_BASE_URL=http://localhost:3000  # or your production domain
```

### 2. Create OAuth Applications

#### Google

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials (Web Application)
5. Add redirect URI: `http://localhost:3000/auth/oauth/callback/google`

#### Apple

1. Go to [Apple Developer](https://developer.apple.com/)
2. Create a new App ID with "Sign in with Apple" capability
3. Create a Service ID
4. Create a private key for Sign in with Apple
5. Add redirect URI: `http://localhost:3000/auth/oauth/callback/apple`

#### Facebook

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app
3. Add Facebook Login product
4. Configure OAuth redirect URIs: `http://localhost:3000/auth/oauth/callback/facebook`

## API Endpoints

### Initiate OAuth Authorization

```http
POST /api/auth/oauth/authorize/:provider
```

**Request:**

```json
{
  "provider": "google" | "apple" | "facebook"
}
```

**Response:**

```json
{
  "authorizationUrl": "https://...",
  "state": "uuid",
  "codeVerifier": "random-string"
}
```

### Handle OAuth Callback

```http
GET /api/auth/oauth/callback/:provider?code=auth_code&state=state_value
```

The backend automatically:

1. Validates the state and code
2. Exchanges the code for an access token
3. Fetches user information
4. Creates or links the user account
5. Creates a session cookie

### Link OAuth Provider to Existing Account

```http
POST /api/auth/oauth/link/:provider
```

Requires authenticated session. Similar flow to authorize endpoint.

### Unlink OAuth Provider

```http
DELETE /api/auth/oauth/link/:provider
```

Requires authenticated session.

## Frontend Integration

### Login Page

The login page includes OAuth provider buttons:

```typescript
import { initiateOAuth, storeOAuthState } from './authApi';

async function handleOAuthLogin(provider: 'google' | 'apple' | 'facebook') {
  const { authorizationUrl, state, codeVerifier } =
    await initiateOAuth(provider);

  // Store state for verification on callback
  storeOAuthState(state, codeVerifier);

  // Redirect to provider
  window.location.href = authorizationUrl;
}
```

### OAuth Callback Page

The callback page handles the redirect from OAuth providers:

```typescript
// Route: /auth/oauth/callback/:provider?code=...&state=...
export function OAuthCallbackPage() {
  // Automatically processes callback and creates session
}
```

## Database Schema

### oauth_providers table

```sql
CREATE TABLE oauth_providers (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  provider_user_id TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  access_token_expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(provider, provider_user_id)
);
```

## Security Features

1. **PKCE (Proof Key for Code Exchange)**
   - Code verifier generated per authorization
   - SHA256 code challenge sent to provider
   - Verified at token exchange

2. **State Validation**
   - Random state generated per authorization
   - Stored in browser session storage with 10-minute TTL
   - Validated on callback to prevent CSRF

3. **Token Storage**
   - Access tokens stored securely in database
   - NOT returned to frontend
   - Refresh tokens supported for long-lived sessions

4. **Email Verification**
   - OAuth login auto-verifies email
   - Automatic account linking if email matches existing user

## Adding a New Provider

### 1. Update Shared Types

Add provider to `libs/shared/src/lib/auth.dto.ts`:

```typescript
export type OAuthProviderType =
  | 'google'
  | 'apple'
  | 'facebook'
  | 'new_provider';
```

### 2. Update OAuth Plugin Modules

Add provider configuration in `projects/rod-manager/apps/api/src/app/plugins/oauth/oauthConfigs.ts` and update OAuth service logic in `projects/rod-manager/apps/api/src/app/plugins/oauth/service.ts`:

```typescript
const newProviderClientId = process.env.OAUTH_NEW_PROVIDER_CLIENT_ID;
const newProviderClientSecret = process.env.OAUTH_NEW_PROVIDER_CLIENT_SECRET;

if (newProviderClientId && newProviderClientSecret) {
  configs.set('new_provider', {
    provider: 'new_provider',
    clientId: newProviderClientId,
    clientSecret: newProviderClientSecret,
    authorizationEndpoint: 'https://provider.com/oauth/authorize',
    tokenEndpoint: 'https://provider.com/oauth/token',
    userInfoEndpoint: 'https://provider.com/oauth/userinfo',
    redirectUri: `${process.env.OAUTH_REDIRECT_BASE_URL ?? 'http://localhost:3000'}/auth/oauth/callback/new_provider`,
  });
}
```

Implement provider-specific user info parsing in `projects/rod-manager/apps/api/src/app/plugins/oauth/userInfo.ts` and service wiring in `projects/rod-manager/apps/api/src/app/plugins/oauth/service.ts`.

### 3. Update Login Page

Add button in `projects/rod-manager/apps/web/src/app/auth/loginPage.tsx`:

```typescript
<button
  onClick={() => {
    void handleOAuthLogin('new_provider');
  }}
  type="button"
>
  New Provider
</button>
```

### 4. Set Environment Variables

```bash
OAUTH_NEW_PROVIDER_CLIENT_ID=...
OAUTH_NEW_PROVIDER_CLIENT_SECRET=...
```

## Troubleshooting

### "OAuth provider not configured"

- Ensure environment variables are set
- Server must be restarted after adding environment variables

### "Invalid or expired OAuth state"

- State expires after 10 minutes
- Browser session storage might be cleared
- Check if cookies/storage are enabled

### "Failed to exchange code for token"

- Verify client ID and secret are correct
- Ensure redirect URI matches provider configuration
- Check provider's token endpoint

### Email auto-linking not working

- Confirm email privacy settings are correct on provider
- Some providers require explicit email sharing permission

## Testing

### Local Testing

1. Set up local OAuth app credentials
2. Use `http://localhost:3000` as redirect base URL
3. Clear browser session storage between tests
4. Check browser console for errors

### Production Considerations

1. Use `https://` for OAUTH_REDIRECT_BASE_URL
2. Ensure provider redirect URIs match exactly
3. Implement email confirmation for security
4. Monitor token refresh and expiration
5. Implement rate limiting on OAuth endpoints
6. Consider adding explicit user confirmation for account linking
