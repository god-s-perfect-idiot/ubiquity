# Accounts Store Usage Guide

The accounts store provides a centralized way to manage OAuth authentication tokens and user data across different providers.

## Current Structure

```
accounts/
├── spotify/
│   ├── access_token
│   ├── refresh_token
│   ├── expires_at
│   ├── user
│   └── is_authenticated
└── [future providers...]
```

## Basic Usage

### Import the Store

```javascript
import { accountsStore } from '../../store/accounts.js';
```

### Check Authentication Status

```javascript
// Check if Spotify is authenticated
const isSpotifyAuth = accountsStore.isAuthenticated('spotify');

// Check if any account is authenticated
const hasAnyAuth = accountsStore.hasAnyAuthenticated();

// Get all authenticated providers
const providers = accountsStore.getAuthenticatedProviders();
```

### Get Account Data

```javascript
// Get full account data
const spotifyAccount = accountsStore.getAccount('spotify');

// Get access token (with expiration check)
const token = accountsStore.getAccessToken('spotify');

// Check if token is valid
const isValid = accountsStore.hasValidToken('spotify');
```

### Authentication Operations

```javascript
// Set authentication data (after OAuth callback)
accountsStore.setAuth('spotify', {
  access_token: 'token_here',
  expires_in: 3600,
  refresh_token: 'refresh_token_here'
});

// Set user data
accountsStore.setUser('spotify', userData);

// Save to localStorage
accountsStore.saveToStorage('spotify');

// Logout
accountsStore.logout('spotify');
accountsStore.cleanupStorage('spotify');
```

## Extending for New OAuth Providers

### 1. Add Provider to Store Structure

```javascript
// In src/store/accounts.js, add to the initial state:
accounts: {
  spotify: { /* existing */ },
  github: {
    access_token: null,
    refresh_token: null,
    expires_at: null,
    user: null,
    is_authenticated: false
  },
  google: {
    access_token: null,
    refresh_token: null,
    expires_at: null,
    user: null,
    is_authenticated: false
  }
}
```

### 2. Update Storage Methods

```javascript
// In initFromStorage(), add:
const githubToken = localStorage.getItem('github_access_token');
const githubExpires = localStorage.getItem('github_expires_at');
// ... handle GitHub data

// In saveToStorage(), add:
if (provider === 'github') {
  localStorage.setItem('github_access_token', account.access_token);
  // ... etc
}

// In cleanupStorage(), add:
if (provider === 'github') {
  localStorage.removeItem('github_access_token');
  // ... etc
}
```

### 3. Create Provider-Specific Configuration

```javascript
// src/lib/github-config.js
export const GITHUB_CONFIG = {
  CLIENT_ID: import.meta.env.VITE_GITHUB_CLIENT_ID,
  SCOPES: ['user', 'repo', 'read:org']
};

export function getGithubAuthUrl() {
  // GitHub OAuth implementation
}
```

### 4. Create Provider-Specific API Endpoint

```javascript
// src/routes/api/github/token/+server.js
export async function POST({ request }) {
  // GitHub token exchange logic
}
```

### 5. Create Provider Page

```javascript
// src/routes/github/+page.svelte
import { accountsStore } from '../../store/accounts.js';

// Use the same pattern as Spotify
const isAuthenticated = accountsStore.isAuthenticated('github');
const token = accountsStore.getAccessToken('github');
```

## Environment Variables

Add to your `.env` file:

```bash
# Spotify
VITE_SPOTIFY_CLIENT_ID=your_spotify_client_id
VITE_SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
VITE_SPOTIFY_REDIRECT_URI=your_redirect_uri

# GitHub (future)
VITE_GITHUB_CLIENT_ID=your_github_client_id
VITE_GITHUB_CLIENT_SECRET=your_github_client_secret
VITE_GITHUB_REDIRECT_URI=your_redirect_uri

# Google (future)
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_GOOGLE_CLIENT_SECRET=your_google_client_secret
VITE_GOOGLE_REDIRECT_URI=your_redirect_uri
```

## Benefits

✅ **Centralized Management**: All OAuth data in one place  
✅ **Consistent Interface**: Same methods for all providers  
✅ **Automatic Expiration**: Built-in token validation  
✅ **Persistent Storage**: Automatic localStorage sync  
✅ **Easy Extension**: Simple pattern for new providers  
✅ **Type Safety**: Structured data for each provider  

## Example: Adding GitHub OAuth

```javascript
// 1. Add to accounts store structure
// 2. Create github-config.js
// 3. Create /api/github/token endpoint
// 4. Create /github page
// 5. Use accountsStore.isAuthenticated('github')

// The pattern is identical to Spotify!
```

This architecture makes it trivial to add new OAuth providers while maintaining consistency across your application.
