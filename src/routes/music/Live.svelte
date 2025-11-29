<script>
	import Icon from '@iconify/svelte';
	import { musicStore } from '../../store/music.js';
	import { accentColorStore, textColorClassStore } from '../../utils/theme';

	export let gridSize = '2x2'; // '2x2' or '4x2'

	$: accentColor = $accentColorStore;
	$: textColor = $textColorClassStore;

	// Subscribe directly to musicStore for reactive updates
	$: musicState = $musicStore;
	$: currentTrackData = musicState?.currentTrack || null;
	$: isPlayingState = musicState?.isPlaying || false;

	function formatTime(seconds) {
		const mins = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60);
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	}

	async function handlePlayPause(event) {
		event.preventDefault();
		event.stopPropagation();
		await musicStore.togglePlayPause();
	}

	async function handleNext(event) {
		event.preventDefault();
		event.stopPropagation();
		await musicStore.playNext();
	}

	async function handlePrevious(event) {
		event.preventDefault();
		event.stopPropagation();
		await musicStore.playPrevious();
	}

	// Make these reactive so they update when currentTrackData changes
	$: trackDisplayName = currentTrackData ? (currentTrackData.name || 'Unknown track') : 'No track playing';
	$: trackArtist = currentTrackData?.artists 
		? (Array.isArray(currentTrackData.artists) 
			? currentTrackData.artists.map((a) => a.name).join(', ')
			: 'Unknown Artist')
		: 'Unknown Artist';
	$: backgroundStyle = currentTrackData?.album?.images && currentTrackData.album.images.length > 0
		? `background-image: url('${currentTrackData.album.images[0].url}');`
		: '';
</script>

{#if gridSize === '2x2'}
	<!-- 2x2 Tile: Compact music player -->
	<div
		class="w-full h-full flex flex-col justify-between items-between text-white {textColor} relative overflow-hidden p-2"
		style="background: linear-gradient(135deg, {accentColor} 0%, {accentColor}dd 100%);"
	>
		{#if currentTrackData}
			<!-- Track info -->
			<div class="flex flex-col items-start gap-1 flex-1 justify-center">
				<span class="text-lg font-[500] truncate w-full" title={trackDisplayName}>
					{trackDisplayName}
				</span>
				{#if trackArtist}
					<span class="text-sm font-[300] opacity-90 truncate w-full" title={trackArtist}>
						{trackArtist}
					</span>
				{/if}
			</div>

			<!-- Controls -->
			<div class="flex flex-row justify-between px-2 pb-2 items-center gap-2">
				<button
					on:click={handlePrevious}
					class="p-1 rounded-full border-2 border-white transition-colors"
					title="Previous"
				>
					<Icon icon="mdi:skip-previous" width="24" height="24" />
				</button>
				<button
					on:click={handlePlayPause}
					class="p-1 rounded-full border-2 border-white transition-colors"
					title={isPlayingState ? 'Pause' : 'Play'}
				>
					<Icon icon={isPlayingState ? 'mdi:pause' : 'mdi:play'} width="24" height="24" />
				</button>
				<button
					on:click={handleNext}
					class="p-1 rounded-full border-2 border-white transition-colors"
					title="Next"
				>
					<Icon icon="mdi:skip-next" width="24" height="24" />
				</button>
			</div>
		{:else}
			<!-- Empty state -->
			<div class="flex flex-col items-center justify-center h-full gap-2">
				<Icon icon="ic:sharp-headphones" width="56" height="56" />
				<span class="text-base font-medium left-2 bottom-2 absolute">Music Player</span>
			</div>
		{/if}
	</div>
{:else if gridSize === '4x2'}
	<!-- 4x2 Tile: Full music player with more details -->
	<div
		class="w-full h-full flex flex-row justify-between text-white {textColor} relative overflow-hidden p-3 bg-cover bg-center"
		style={backgroundStyle}
	>
		<!-- Overlay for better text readability -->
		<div class="absolute inset-0 z-0"></div>
		
		{#if currentTrackData}
			<!-- Left side: Track info -->
			<div class="flex flex-col justify-between h-full flex-1 min-w-0 relative z-10">
				<div class="flex flex-col items-start gap-1">
					<span class="text-xl font-[500] truncate w-full" title={trackDisplayName}>
						{trackDisplayName}
					</span>
					{#if trackArtist}
						<span class="text-base font-[300] opacity-90 truncate w-full" title={trackArtist}>
							{trackArtist}
						</span>
					{/if}
				</div>

				<!-- Controls -->
				<div class="flex flex-row justify-between items-center gap-3 max-w-[70%]">
					<button
						on:click={handlePrevious}
						class="p-2 rounded-full border-2 border-white transition-colors"
						title="Previous"
					>
						<Icon icon="mdi:skip-previous" width="28" height="28" />
					</button>
					<button
						on:click={handlePlayPause}
						class="p-2 rounded-full border-2 border-white transition-colors"
						title={isPlayingState ? 'Pause' : 'Play'}
					>
						<Icon icon={isPlayingState ? 'mdi:pause' : 'mdi:play'} width="28" height="28" />
					</button>
					<button
						on:click={handleNext}
						class="p-2 rounded-full border-2 border-white transition-colors"
						title="Next"
					>
						<Icon icon="mdi:skip-next" width="28" height="28" />
					</button>
				</div>
			</div>
		{:else}
			<!-- Empty state -->
			<div class="flex flex-col items-center justify-center h-full w-full gap-3 relative z-10">
				<Icon icon="ic:sharp-headphones" width="72" height="72" />
				<span class="absolute bottom-2 left-2 text-base font-medium">Music Player</span>
			</div>
		{/if}
	</div>
{/if}

