// Helper function to get Client ID from localStorage only
function getClientId() {
	if (typeof window !== 'undefined') {
		return localStorage.getItem('ytmusic_client_id') || '';
	}
	return '';
}

// YouTube Music (YouTube Data API v3) configuration constants
export const YTMUSIC_CONFIG = {
	// Get Client ID from localStorage
	get CLIENT_ID() {
		return getClientId();
	},

	// Scopes for the YouTube Data API
	SCOPES: ['https://www.googleapis.com/auth/youtube.readonly']
};

// Helper function to get redirect URI
export function getRedirectUri() {
	// Use current origin (works for both development and production)
	if (typeof window !== 'undefined') {
		return `${window.location.origin}/ytmusic/callback`;
	}
	// Fallback for server-side (shouldn't happen for auth URL)
	return import.meta.env.VITE_YTMUSIC_REDIRECT_URI || 'https://ubiquity-1.netlify.app/ytmusic/callback';
}

// Helper function to get authorization URL
export function getAuthUrl() {
	const clientId = YTMUSIC_CONFIG.CLIENT_ID;

	if (!clientId) {
		console.error(
			'YTMusic Client ID is not configured. Please set it in Settings > Accounts > YTMusic.'
		);
		throw new Error('YTMusic Client ID is not configured');
	}

	const params = new URLSearchParams({
		client_id: clientId,
		response_type: 'code', // Authorization Code Flow
		redirect_uri: getRedirectUri(),
		scope: YTMUSIC_CONFIG.SCOPES.join(' '),
		access_type: 'offline', // Request a refresh token
		include_granted_scopes: 'true',
		prompt: 'consent'
	});

	return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}
