<script>
	import { goto } from '$app/navigation';
	import BottomControls from '../../components/BottomControls.svelte';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';
	import { borderColorClassStore, accentColorStore } from '../../utils/theme';
	import LiveClock from '../clock/Live.svelte';
	import LiveWeather from '../weather/Live.svelte';
	import LivePhotos from '../photos/Live.svelte';
	import Loader from '../../components/Loader.svelte';
	import { fetchApps } from '../../kernel/system-utils';
	import { kernel } from '../../kernel/store';
	import { appInfoStore } from '../../store/appInfo';
	import App from './App.svelte';
	import { addToast } from '../../store/toast';

	$: borderClass = $borderColorClassStore;
	$: accentColor = $accentColorStore;

	let isExiting = false;
	let isExpanded = false;
	let isUnmounting = false;
	let selectedApp = null;
	let selectedGridSize = '2x2';
	let isLoadingLiveTile = false;
	let allApps = [];

	// const systemAppsWithLiveTiles = [
	// 	{
	// 		name: 'Clock',
	// 		route: '/clock',
	// 		icon: 'nrk:clock',
	// 		bgColor: 'bg-indigo-800',
	// 		hasLiveTile: true
	// 	},
	// 	{
	// 		name: 'Weather',
	// 		route: '/weather',
	// 		icon: 'material-symbols-light:weather-mix',
	// 		bgColor: 'bg-blue-900',
	// 		hasLiveTile: true
	// 	},
	// 	{
	// 		name: 'Photos',
	// 		route: '/photos',
	// 		icon: 'tdesign:image-filled',
	// 		bgColor: 'bg-orange-600',
	// 		hasLiveTile: true
	// 	}
	// ];

	function handleToggle(event) {
		isExpanded = event.detail.expanded;
	}

	function closePage() {
		isUnmounting = true;
		setTimeout(() => {
			isExpanded = false;
			setTimeout(() => {
				isExiting = true;
				setTimeout(() => {
					goto('/');
				}, 200);
			}, 300);
		}, 300);
	}

	function selectApp(app) {
		isExpanded = false;
		selectedApp = app;
		isLoadingLiveTile = true;
		// Reset loading state after a short delay to allow components to initialize
		setTimeout(() => {
			isLoadingLiveTile = false;
		}, 300);
	}

	function goBack() {
		selectedApp = null;
		selectedGridSize = '2x2';
		isExpanded = false;
	}

	function selectGridSize(size) {
		selectedGridSize = size;
		if (selectedApp) {
			isLoadingLiveTile = true;
			// Reset loading state after a short delay to allow components to re-render
			setTimeout(() => {
				isLoadingLiveTile = false;
			}, 300);
		}
	}

	function getLiveTileComponent() {
		if (!selectedApp) return null;

		if (selectedApp.name === 'Clock') {
			return LiveClock;
		} else if (selectedApp.name === 'Weather') {
			return LiveWeather;
		} else if (selectedApp.name === 'Photos') {
			return LivePhotos;
		}
		return null;
	}

	onMount(() => {
		isExpanded = false;
		// Fetch all apps
		const installedApps = fetchApps(kernel.fs.getFiles());
		// const appInfo = appInfoStore.getState();
		installedApps.forEach((app) => {
			const appInfo = appInfoStore.getAppInfo(app.name);
			if (appInfo) {
				app.icon = appInfo.icon;
				app.bgColor = appInfo.bgColor;
			}
		});
		allApps = installedApps;
		console.log(allApps);
	});

	$: LiveTileComponent = getLiveTileComponent();
</script>

{#if selectedApp}
	<App app={selectedApp} {isExiting} onBack={goBack} />
{:else}
	<div class="page-holder">
		<div class="page pt-4 px-4 flex flex-col h-screen overflow-y-auto" class:page-exit={isExiting}>
			<span class="text-6xl font-[300] mb-8 lowercase">live tiles</span>

			<div class="flex flex-col gap-6">
				<!-- App Selection -->
				<div class="flex flex-col gap-4">
					<h2 class="text-2xl font-[300] mb-2" style="color: {accentColor};">select app</h2>
					<div class="flex flex-row gap-8 flex-wrap">
						{#each allApps as app}
							<button
								class="flex flex-col items-start justify-center gap-2"
								on:click={() => selectApp(app)}
							>
								<div class="w-16 h-16 {app.bgColor} flex items-center justify-center text-white">
									<img src={app.icon} width="40" height="40" alt={app.name} />
								</div>
								<span class="text-sm font-[400] truncate max-w-[64px]">{app.name}</span>
							</button>
						{/each}
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}

<BottomControls expanded={isExpanded} unmounting={isUnmounting} on:toggle={handleToggle}>
	<div class="flex flex-row gap-12 w-full justify-center items-center">
		{#if selectedApp}
			<div
				class="btn-animate flex flex-col gap-2 justify-center items-center"
				class:animate={isExpanded}
			>
				<button
					on:click={() => goBack()}
					class="flex flex-col border {borderClass} rounded-full !border-2 p-2 font-bold"
				>
					<Icon icon="subway:left-arrow" width="18" height="18" strokeWidth="2" />
				</button>

				<span class="text-xs font-[400]">back</span>
			</div>
			<div
				class="btn-animate flex flex-col gap-2 justify-center items-center"
				class:animate={isExpanded}
			>
				<button
					on:click={() => {
						addToast('Coming soon. i need some coffee.');
					}}
					class="flex flex-col border {borderClass} rounded-full !border-2 p-2 font-bold"
				>
					<Icon icon="ic:baseline-publish" width="18" height="18" strokeWidth="2" />
				</button>
				<span class="text-xs font-[400]">publish</span>
			</div>
		{/if}
		<div
			class="btn-animate flex flex-col gap-2 justify-center items-center"
			class:animate={isExpanded}
		>
			<button
				on:click={closePage}
				class="flex flex-col border {borderClass} rounded-full !border-2 p-2 font-bold"
			>
				<Icon icon="rivet-icons:close" width="18" height="18" strokeWidth="2" />
			</button>
			<span class="text-xs font-[400]">close</span>
		</div>
	</div>
</BottomControls>

<style>
	.btn-animate {
		transform: translateY(120%);
		opacity: 0;
	}

	.btn-animate.animate {
		animation: button-overshoot 0.5s ease-out forwards;
		opacity: 1;
	}

	@keyframes button-overshoot {
		0% {
			transform: translateY(120%);
		}
		70% {
			transform: translateY(-20%);
		}
		100% {
			transform: translateY(0);
		}
	}

	.page {
		scrollbar-width: thin;
		scrollbar-color: #4a5568 #1a202c;
	}

	.page::-webkit-scrollbar {
		width: 6px;
	}

	.page::-webkit-scrollbar-track {
		background: #1a202c;
	}

	.page::-webkit-scrollbar-thumb {
		background: #4a5568;
		border-radius: 3px;
	}

	.page::-webkit-scrollbar-thumb:hover {
		background: #718096;
	}
</style>
