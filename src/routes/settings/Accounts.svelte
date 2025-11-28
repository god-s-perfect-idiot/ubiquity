<script>
	import Icon from '@iconify/svelte';
	import Button from '../../components/Button.svelte';
	import Input from '../../components/Input.svelte';
	import { onMount } from 'svelte';
	import { accountsStore } from '../../store/accounts.js';
	import { addToast } from '../../store/toast';
	import { backgroundThemeStore } from '../../utils/theme';
	import { browser } from '$app/environment';

	$: backgroundTheme = $backgroundThemeStore;
	$: bottomBarBg = backgroundTheme === 'light' ? '#dedede' : '#1f1f1f';

	export let isExiting = false;
	export let hideBottomBar = () => {};

	let page = '';
	let isSpotifyConnected = false;
	let spotifyClientId = '';
	let spotifyClientSecret = '';
	const SPOTIFY_REDIRECT_URI = 'https://ubiquity-1.netlify.app/spotify/callback';

	onMount(() => {
		hideBottomBar(false);
		checkSpotifyStatus();
		loadSpotifySettings();
	});

	const loadSpotifySettings = () => {
		if (!browser) return;
		
		// Load Client ID from localStorage or fallback to env var
		spotifyClientId = localStorage.getItem('spotify_client_id') || 
			import.meta.env.VITE_SPOTIFY_CLIENT_ID || '';
		
		// Load Client Secret from localStorage or fallback to env var
		spotifyClientSecret = localStorage.getItem('spotify_client_secret') || 
			import.meta.env.VITE_SPOTIFY_CLIENT_SECRET || '';
	};

	const saveSpotifySettings = () => {
		if (!browser) return;
		
		localStorage.setItem('spotify_client_id', spotifyClientId);
		localStorage.setItem('spotify_client_secret', spotifyClientSecret);
		addToast('Spotify credentials saved successfully.');
	};

	const checkSpotifyStatus = () => {
		isSpotifyConnected = accountsStore.isAuthenticated('spotify');
	};

	const showSubPage = (newPage) => {
		page = newPage;
		hideBottomBar(true);
	};

	const showMainPage = () => {
		page = '';
		hideBottomBar(false);
	};

	const disconnectSpotify = () => {
		// Logout from Spotify
		accountsStore.logout('spotify');
		// Clean up localStorage
		accountsStore.cleanupStorage('spotify');
		// Update local state
		isSpotifyConnected = false;
		// Go back to main page
		addToast('Spotify account disconnected successfully.');
		showMainPage();
	};

	const openSpotifyApp = () => {
		window.location.href = '/spotify';
	};
</script>

{#if page === ''}
	<div class="page-holder">
		<div class="page pt-4 px-4 flex flex-col h-screen" class:page-exit={isExiting}>
			<span class="text-6xl font-[300]">accounts</span>
			<div class="flex flex-col gap-8 mt-12 flex-1 overflow-y-auto">
				<button class="flex flex-row gap-4 text-left" on:click={() => showSubPage('spotify')}>
					<Icon icon="mdi:spotify" width="64" height="64" class="text-white" />
					<div class="flex flex-col gap-1">
						<span class="text-3xl font-[300]">spotify</span>
						<span class="text-sm font-[300] text-[#a1a1a1]">
							{isSpotifyConnected ? 'connected' : 'not connected'}
						</span>
					</div>
				</button>
			</div>
		</div>
	</div>
{:else if page === 'spotify'}
	<div class="page-holder">
		<div class="page pt-4 px-4 flex flex-col h-screen" class:page-exit={isExiting}>
			<span class="text-6xl font-[300]">spotify</span>
			<div class="flex flex-col gap-6 mt-12 flex-1 overflow-y-auto pb-24">
				<!-- Developer Setup -->
				<div class="flex flex-col gap-4">
					<span class="text-xl font-[300]">developer setup</span>
					<span class="text-sm font-[300] text-[#a1a1a1]"
						>Get credentials from the
						<a
							href="https://developer.spotify.com/dashboard"
							target="_blank"
							rel="noopener noreferrer"
							class="text-blue-400 underline"
							>Spotify Developer Dashboard</a
						>.</span
					>
					
					<div class="flex flex-col gap-4">
						<Input label="Client ID" bind:content={spotifyClientId} />
						<div class="flex flex-col gap-2 font-[400]">
							<label for="spotify-client-secret" class="text-[#767676] text-sm">Client Secret</label>
							<input
								id="spotify-client-secret"
								type="password"
								bind:value={spotifyClientSecret}
								class="bg-[#bebebe] w-full py-2 pl-2 outline-none text-[#121212] text-base"
							/>
						</div>
					</div>

					<div class="flex flex-col gap-2">
						<span class="text-sm font-[300] text-[#a1a1a1]">Redirect URI:</span>
						<span class="text-base font-[300] text-[#767676] mt-1"
							>{SPOTIFY_REDIRECT_URI}</span
						>
					</div>

					<div class="mt-2">
						<Button
							text="save"
							onClick={saveSpotifySettings}
							className="btn"
						/>
					</div>
				</div>

				<!-- Connection Status -->
				<div class="flex flex-col gap-2">
					{#if isSpotifyConnected}
						<span class="text-xl font-[300]"
							>Your spotify account is connected. To remove it, click the disconnect button below.</span
						>
						<span class="text-sm font-[300] text-[#a1a1a1]"
							>You connected your account by performing oAuth from your browser. Dont worry, we dont
							store any of your credentials. Everything only exists on your device's local storage.</span
						>
					{:else}
						<span class="text-xl font-[300]"
							>Your spotify account is not connected. You can connect it from the spotify music player
							app.</span
						>
						<span class="text-sm font-[300] text-[#a1a1a1]"
							>After configuring your credentials above, you can click the button below to open the
							music player app and connect your account.</span
						>
					{/if}
				</div>
			</div>
		</div>
	</div>

	<div
		class="w-full justify-between flex flex-row fixed bottom-0 right-0 px-4 py-2 gap-8 z-10 bottom-bar"
		class:bottom-bar-exit={isExiting}
		style="background-color: {bottomBarBg};"
	>
		{#if isSpotifyConnected}
			<div class="btn w-full">
				<Button
					text="disconnect"
					onClick={disconnectSpotify}
					className="btn !w-full"
					style="background-color: {bottomBarBg};"
				/>
			</div>
		{:else}
			<div class="btn w-full">
				<Button
					text="connect"
					onClick={openSpotifyApp}
					className="btn !w-full"
					style="background-color: {bottomBarBg};"
				/>
			</div>
		{/if}
		<div class="btn w-full">
			<Button
				text="close"
				onClick={showMainPage}
				className="btn !w-full"
				style="background-color: {bottomBarBg};"
			/>
		</div>
	</div>
{/if}

<style>
	.page {
		height: 100%;
		width: 100%;
	}
</style>
