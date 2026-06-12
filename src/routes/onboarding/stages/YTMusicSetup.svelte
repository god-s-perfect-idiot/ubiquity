<script>
	import { accentColorStore, textColorClassStore } from '../../../utils/theme';
	import { accountsStore } from '../../../store/accounts.js';
	import { addToast } from '../../../store/toast';
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import Input from '../../../components/Input.svelte';
	import Button from '../../../components/Button.svelte';
	import { getAuthUrl } from '../../../lib/ytmusic-config.js';

	$: accentColor = $accentColorStore;
	$: textClass = $textColorClassStore;

	let ytmusicClientId = '';
	let ytmusicClientSecret = '';
	let isYtmusicConnected = false;
	const YTMUSIC_REDIRECT_URI = 'https://ubiquity-1.netlify.app/ytmusic/callback';

	onMount(() => {
		checkYtmusicStatus();
		loadYtmusicSettings();
	});

	const loadYtmusicSettings = () => {
		if (!browser) return;

		ytmusicClientId = localStorage.getItem('ytmusic_client_id') || '';
		ytmusicClientSecret = localStorage.getItem('ytmusic_client_secret') || '';
	};

	const saveYtmusicSettings = () => {
		if (!browser) return;

		localStorage.setItem('ytmusic_client_id', ytmusicClientId);
		localStorage.setItem('ytmusic_client_secret', ytmusicClientSecret);
		addToast('YTMusic credentials saved successfully.');
	};

	const checkYtmusicStatus = () => {
		isYtmusicConnected = accountsStore.isAuthenticated('ytmusic');
	};

	const connectYtmusic = () => {
		if (!ytmusicClientId) {
			addToast('Please enter your YTMusic Client ID first.');
			return;
		}

		if (ytmusicClientId) {
			localStorage.setItem('ytmusic_client_id', ytmusicClientId);
			if (ytmusicClientSecret) {
				localStorage.setItem('ytmusic_client_secret', ytmusicClientSecret);
			}
		}

		try {
			const authUrl = getAuthUrl();
			window.location.href = authUrl;
		} catch (error) {
			addToast('Error: ' + error.message);
		}
	};

	const disconnectYtmusic = () => {
		accountsStore.logout('ytmusic');
		accountsStore.cleanupStorage('ytmusic');
		isYtmusicConnected = false;
		addToast('YTMusic account disconnected successfully.');
	};
</script>

<div class="flex flex-col gap-4 items-start justify-start w-full h-full p-4">
	<span class="text-lg text-left w-full font-semibold {textClass}">YTMUSIC SETUP</span>

	<p class="text-lg {textClass}">
		You can connect your YouTube Music account to your device to use the Metro YTMusic music player
		app.
	</p>

	<!-- Developer Setup -->
	<div class="flex flex-col gap-4 w-full">
		<span class="text-sm font-[300] text-[#a1a1a1]">
			Create an OAuth client (with the YouTube Data API v3 enabled) in the
			<a
				href="https://console.cloud.google.com/apis/credentials"
				target="_blank"
				rel="noopener noreferrer"
				class="text-blue-400 underline">Google Cloud Console</a
			>.
		</span>

		<div class="flex flex-col gap-4">
			<Input label="Client ID" bind:content={ytmusicClientId} />
			<div class="flex flex-col gap-2 font-[400]">
				<label for="ytmusic-client-secret" class="text-[#767676] text-sm">Client Secret</label>
				<input
					id="ytmusic-client-secret"
					type="password"
					bind:value={ytmusicClientSecret}
					class="bg-[#bebebe] w-full py-2 pl-2 outline-none text-[#121212] text-base"
				/>
			</div>
		</div>

		<div class="flex flex-col gap-2">
			<span class="text-sm font-[300] text-[#a1a1a1]">Redirect URI:</span>
			<span class="text-base font-[300] text-[#767676] mt-1">{YTMUSIC_REDIRECT_URI}</span>
		</div>

		<div class="mt-2">
			<Button text="save" onClick={saveYtmusicSettings} />
		</div>
	</div>

	<!-- Connection Status -->
	<div class="flex flex-col gap-4 w-full mt-6">
		{#if isYtmusicConnected}
			<span class="text-xl font-[300]">Your YTMusic account is connected.</span>
			<Button text="disconnect ytmusic account" onClick={disconnectYtmusic} />
		{:else}
			<span class="text-xl font-[300]">Your YTMusic account is not connected .</span>
			<Button text="connect ytmusic account" onClick={connectYtmusic} />
		{/if}
	</div>
</div>

<style>
	.stage-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		gap: 1.5rem;
	}

	.icon-container {
		width: 120px;
		height: 120px;
		border-radius: 50%;
		background-color: var(--accent-color);
		display: flex;
		align-items: center;
		justify-content: center;
		opacity: 0.9;
		margin-bottom: 1rem;
	}

	.stage-title {
		font-size: 2rem;
		font-weight: 300;
		margin: 0;
	}

	.stage-description {
		font-size: 1.125rem;
		line-height: 1.6;
		opacity: 0.8;
		margin: 0;
		max-width: 500px;
	}
</style>
