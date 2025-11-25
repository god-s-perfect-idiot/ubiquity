<script>
	import { goto } from '$app/navigation';
	import BottomControls from '../../components/BottomControls.svelte';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';
	import { borderColorClassStore } from '../../utils/theme';
	import LiveClock from '../clock/Live.svelte';
	import LiveWeather from '../weather/Live.svelte';
	import LivePhotos from '../photos/Live.svelte';
	import Loader from '../../components/Loader.svelte';
	
	$: borderClass = $borderColorClassStore;
	
	let isExiting = false;
	let isExpanded = false;
	let isUnmounting = false;
	let selectedApp = null;
	let selectedGridSize = '2x2';
	let isLoadingLiveTile = false;
	
	const systemAppsWithLiveTiles = [
		{
			name: 'Clock',
			route: '/clock',
			icon: 'nrk:clock',
			bgColor: 'bg-indigo-800',
			hasLiveTile: true
		},
		{
			name: 'Weather',
			route: '/weather',
			icon: 'material-symbols-light:weather-mix',
			bgColor: 'bg-blue-900',
			hasLiveTile: true
		},
		{
			name: 'Photos',
			route: '/photos',
			icon: 'tdesign:image-filled',
			bgColor: 'bg-orange-600',
			hasLiveTile: true
		}
	];

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
		selectedApp = app;
		isLoadingLiveTile = true;
		// Reset loading state after a short delay to allow components to initialize
		setTimeout(() => {
			isLoadingLiveTile = false;
		}, 300);
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
	});
	
	$: LiveTileComponent = getLiveTileComponent();
</script>

<div class="page-holder">
	<div class="page pt-4 px-4 flex flex-col h-screen overflow-y-auto" class:page-exit={isExiting}>
		<span class="text-6xl font-[300] mb-8 lowercase">live tiles</span>
		
		<div class="flex flex-col gap-6">
			<!-- App Selection -->
			<div class="flex flex-col gap-4">
				<h2 class="text-2xl font-[300] mb-2">Select App</h2>
				<div class="flex flex-row gap-4 flex-wrap">
					{#each systemAppsWithLiveTiles as app}
						<button
							class="flex flex-col items-center justify-center gap-2 p-4 border-2 {borderClass} {selectedApp?.name === app.name ? 'opacity-100' : 'opacity-50'} transition-opacity"
							on:click={() => selectApp(app)}
						>
							<div class="w-16 h-16 {app.bgColor} flex items-center justify-center text-white">
								<Icon icon={app.icon} width="32" height="32" />
							</div>
							<span class="text-sm font-[300]">{app.name}</span>
						</button>
					{/each}
				</div>
			</div>

			{#if selectedApp}
				<!-- Grid Size Selection -->
				<div class="flex flex-col gap-4">
					<h2 class="text-2xl font-[300] mb-2">Select Tile Size</h2>
					<div class="flex flex-row gap-4">
						<button
							class="flex flex-col items-center justify-center gap-2 p-4 border-2 {borderClass} {selectedGridSize === '2x2' ? 'opacity-100' : 'opacity-50'} transition-opacity"
							on:click={() => selectGridSize('2x2')}
						>
							<div class="w-24 h-24 border-2 {borderClass} flex items-center justify-center">
								<span class="text-sm font-[300]">2x2</span>
							</div>
							<span class="text-sm font-[300]">Square</span>
						</button>
						<button
							class="flex flex-col items-center justify-center gap-2 p-4 border-2 {borderClass} {selectedGridSize === '4x2' ? 'opacity-100' : 'opacity-50'} transition-opacity"
							on:click={() => selectGridSize('4x2')}
						>
							<div class="w-48 h-24 border-2 {borderClass} flex items-center justify-center">
								<span class="text-sm font-[300]">4x2</span>
							</div>
							<span class="text-sm font-[300]">Wide</span>
						</button>
					</div>
				</div>

				<!-- Live Tile Preview -->
				<div class="flex flex-col gap-4">
					<h2 class="text-2xl font-[300] mb-2">Preview</h2>
					<div class="flex flex-col gap-4">
						<div class="border-2 {borderClass} p-4">
							<div class="flex flex-col gap-2 mb-4">
								<span class="text-lg font-[300]">{selectedApp.name} - {selectedGridSize}</span>
								<span class="text-sm opacity-70">This is how the live tile will appear</span>
							</div>
							<div class="border-2 {borderClass} overflow-hidden relative" style="width: {selectedGridSize === '2x2' ? '200px' : '400px'}; height: {selectedGridSize === '2x2' ? '200px' : '200px'};">
								{#if isLoadingLiveTile}
									<div class="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
										<Loader />
									</div>
								{:else if LiveTileComponent}
									<svelte:component this={LiveTileComponent} gridSize={selectedGridSize} />
								{/if}
							</div>
						</div>
					</div>
				</div>

				<!-- Actions -->
				<div class="flex flex-col gap-4 mt-4">
					<button
						class="px-4 py-2 border-2 {borderClass} flex items-center justify-center gap-2 text-base"
						on:click={() => {
							// TODO: Implement publish functionality
							alert('Publish functionality coming soon!');
						}}
					>
						<Icon icon="material-symbols:publish" />
						<span>Publish Live Tile</span>
					</button>
				</div>
			{:else}
				<div class="flex flex-col items-start justify-start py-12 text-gray-400">
					<p class="text-lg">Select an app to preview its live tile</p>
				</div>
			{/if}
		</div>
	</div>
</div>

<BottomControls expanded={isExpanded} unmounting={isUnmounting} on:toggle={handleToggle}>
	<div class="flex flex-row gap-12 w-full justify-center items-center">
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

