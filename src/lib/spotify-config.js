// Spotify configuration constants
export const SPOTIFY_CONFIG = {
  // Get Client ID from environment variable
  CLIENT_ID: import.meta.env.VITE_SPOTIFY_CLIENT_ID,
  
  // Scopes for the Spotify API
  SCOPES: [
    'user-read-private',
    'user-read-email',
    'user-read-playback-state',
    'user-modify-playback-state',
    'user-read-currently-playing',
    'streaming',
    'playlist-read-private',
    'playlist-read-collaborative',
    'user-library-read',
    'user-top-read'
  ]
};

// Helper function to get redirect URI
export function getRedirectUri() {
  // Use environment variable or fallback to ngrok URL
  return import.meta.env.VITE_SPOTIFY_REDIRECT_URI;
}

// Helper function to get authorization URL
export function getAuthUrl() {
  const params = new URLSearchParams({
    client_id: SPOTIFY_CONFIG.CLIENT_ID,
    response_type: 'code', // Authorization Code Flow - modern and secure
    redirect_uri: getRedirectUri(),
    scope: SPOTIFY_CONFIG.SCOPES.join(' '),
    show_dialog: 'true'
  });
  
  return `https://accounts.spotify.com/authorize?${params.toString()}`;
}
