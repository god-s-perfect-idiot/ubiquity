import { json } from '@sveltejs/kit';

export async function POST({ request }) {
  try {
    const { code } = await request.json();
    
    if (!code) {
      return json({ error: 'Authorization code is required' }, { status: 400 });
    }

    // Get credentials from environment variables
    const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
    const clientSecret = import.meta.env.VITE_SPOTIFY_CLIENT_SECRET;
    const redirectUri = import.meta.env.VITE_SPOTIFY_REDIRECT_URI;

    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(
          clientId + ':' + clientSecret
        ).toString('base64')
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
