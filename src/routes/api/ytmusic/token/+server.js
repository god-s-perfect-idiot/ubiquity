import { json } from '@sveltejs/kit';

export async function POST({ request }) {
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
		const redirectUri =
			requestRedirectUri ||
			import.meta.env.VITE_YTMUSIC_REDIRECT_URI ||
			'https://ubiquity-1.netlify.app/ytmusic/callback';

		if (!clientId || !clientSecret) {
			return json(
				{
					error:
						'YTMusic credentials are not configured. Please set Client ID and Client Secret in Settings > Accounts > YTMusic.'
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

		// Exchange authorization code for access token (Google OAuth 2.0)
		const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded'
			},
			body: new URLSearchParams({
				grant_type: 'authorization_code',
				code: code,
				redirect_uri: redirectUri,
				client_id: clientId,
				client_secret: clientSecret
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
		console.error('YTMusic token exchange error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
}
