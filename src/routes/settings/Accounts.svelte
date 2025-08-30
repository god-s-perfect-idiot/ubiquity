<script>
	import Icon from '@iconify/svelte';
	import Button from '../../components/Button.svelte';
	import { onMount } from 'svelte';
	import { accountsStore } from '../../store/accounts.js';
	import { addToast } from '../../store/toast';

	export let isExiting = false;
	export let hideBottomBar = () => {};

	let page = '';
	let isSpotifyConnected = false;

	onMount(() => {
		hideBottomBar(false);
		checkSpotifyStatus();
	});

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
			<div class="flex flex-col gap-2 mt-12 flex-1 overflow-y-auto">
				{#if isSpotifyConnected}
					<span class="text-xl font-[300]"
						>Your spotify account is connected. To remove it, click the disconnect button below.</span
					>
					<span class="text-sm font-[300] text-[#a1a1a1]"
						>You connected your account by permforming oAuth from your browser. Dont worry, we dont
						store any of your credentials. Everything only exists on your device's local storage.</span
					>
				{:else}
					<span class="text-xl font-[300]"
						>Your spotify account is not connected. You can connect it from the spotify music player
						app.</span
					>
					<span class="text-sm font-[300] text-[#a1a1a1]"
						>This is the metro app and not the web app. You can click the button below to open the
						music player app and connect your account.</span
					>
				{/if}
			</div>
		</div>
	</div>

	<div
		class="w-full justify-between flex flex-row fixed bottom-0 right-0 px-4 py-2 bg-[#1f1f1f] gap-8 z-10 bottom-bar"
		class:bottom-bar-exit={isExiting}
	>
		<div class="btn w-full">
			<Button
				text={isSpotifyConnected ? 'disconnect' : 'connect'}
				onClick={isSpotifyConnected ? disconnectSpotify : openSpotifyApp}
				className="btn !w-full bg-[#1f1f1f]"
			/>
		</div>
		<div class="btn w-full">
			<Button text="close" onClick={showMainPage} className="btn !w-full bg-[#1f1f1f]" />
		</div>
	</div>
{/if}

<style>
	.page {
		height: 100%;
		width: 100%;
	}
</style>
