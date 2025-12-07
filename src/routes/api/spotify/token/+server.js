import { json } from '@sveltejs/kit';

export async function POST({ request, url }) {
	try {
		const {
			code,
			clientId: requestClientId,
			clientSecret: requestClientSecret,
			redirectUri: requestRedirectUri
		} = await request.json();

		if (!code) {
			return json({ error: 'Authorization code is required' }, { status: 400 });
		}

		// Get credentials from request (user-configured) only
		const clientId = requestClientId;
		const clientSecret = requestClientSecret;

		// Use redirect URI from request (must match what was used in authorization)
		// Fallback to environment variable or production if not provided
		const redirectUri =
			requestRedirectUri ||
			import.meta.env.VITE_SPOTIFY_REDIRECT_URI ||
			'https://ubiquity-1.netlify.app/spotify/callback';

		if (!clientId || !clientSecret) {
			return json(
				{
					error:
						'Spotify credentials are not configured. Please set Client ID and Client Secret in Settings > Accounts > Spotify.'
				},
				{ status: 400 }
			);
		}

		if (!redirectUri) {
			return json(
				{
					error: 'Redirect URI is required for token exchange.'
				},
				{ status: 400 }
			);
		}

		// Exchange authorization code for access token
		const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				Authorization: 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64')
			},
			body: new URLSearchParams({
				grant_type: 'authorization_code',
				code: code,
				redirect_uri: redirectUri
			})
		});

		const tokenData = await tokenResponse.json();

		if (tokenData.error) {
			return json({ error: tokenData.error_description || tokenData.error }, { status: 400 });
		}

		return json({
			access_token: tokenData.access_token,
			expires_in: tokenData.expires_in,
			refresh_token: tokenData.refresh_token
		});
	} catch (error) {
		console.error('Token exchange error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
}
