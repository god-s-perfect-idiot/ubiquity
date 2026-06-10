<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { accountsStore } from '../../../store/accounts.js';
	import { addToast } from '../../../store/toast';
	import { getRedirectUri } from '../../../lib/ytmusic-config.js';
	import Loader from '../../../components/Loader.svelte';

	onMount(() => {
		if (browser) {
			setTimeout(() => {
				handleCallback();
			}, 100);
		}
	});

	async function handleCallback() {
		if (!browser) return;

		console.log('Callback URL:', window.location.href);

		const error =
			new URLSearchParams(window.location.search).get('error') ||
			new URLSearchParams(window.location.hash.substring(1)).get('error');

		if (error) {
			console.error('YTMusic OAuth error:', error);
			setTimeout(() => {
				goto(`/ytmusic?error=${error}`);
			}, 2000);
			return;
		}

		const authCode = new URLSearchParams(window.location.search).get('code');

		if (authCode) {
			console.log('Successfully got authorization code');

			try {
				const storedClientId = localStorage.getItem('ytmusic_client_id') || '';
				const storedClientSecret = localStorage.getItem('ytmusic_client_secret') || '';
				const redirectUri = getRedirectUri();

				const response = await fetch('/api/ytmusic/token', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						code: authCode,
						clientId: storedClientId,
						clientSecret: storedClientSecret,
						redirectUri: redirectUri
					})
				});

				const tokenData = await response.json();

				if (tokenData.error) {
					throw new Error(tokenData.error);
				}

				accountsStore.setAuth('ytmusic', {
					access_token: tokenData.access_token,
					expires_in: tokenData.expires_in,
					refresh_token: tokenData.refresh_token
				});

				accountsStore.saveToStorage('ytmusic');
				window.history.replaceState({}, document.title, '/ytmusic');
				addToast('YTMusic account connected successfully');

				setTimeout(() => {
					goto('/ytmusic?auth_success=true');
				}, 1000);
			} catch (error) {
				console.error('Token exchange failed:', error);
				setTimeout(() => {
					goto('/ytmusic?error=token_exchange_failed');
				}, 3000);
			}
		} else {
			console.error('No authorization code found');
			setTimeout(() => {
				goto('/ytmusic?error=no_code');
			}, 3000);
		}
	}
</script>

<div class="fixed inset-0 flex items-center justify-center bg-[#121212]">
	<Loader />
</div>
