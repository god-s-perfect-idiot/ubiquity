<script>
	import { onMount, onDestroy, tick } from 'svelte';
	import { goto } from '$app/navigation';
	import Icon from '@iconify/svelte';
	import BottomControls from '../../components/BottomControls.svelte';
	import { fetchMusic } from '../../kernel/system-utils';
	import { kernel } from '../../kernel/store';
	import LetterGrid from '../../components/LetterGrid.svelte';
	import { accentColorStore, textColorClassStore, borderColorClassStore } from '../../utils/theme';
	import { musicStore, currentTrack, isPlaying, playbackProgress } from '../../store/music.js';

	let isExpanded = false;
	let isUnmounting = false;
	let isExiting = false;
	let music = [];
	const musicList = {};
	let showGrid = false;
	let showNowPlaying = false; // Control whether to show "now playing" view
	
	// Subscribe to music store
	let currentTrackData = null;
	let isPlayingState = false;
	let progress = { currentTime: 0, duration: 0, seekValue: 0 };
	
	$: accentColor = $accentColorStore;
	$: textClass = $textColorClassStore;
	$: borderClass = $borderColorClassStore;
	
	// Subscribe to music store
	$: currentTrackData = $currentTrack;
	$: isPlayingState = $isPlaying;
	$: progress = $playbackProgress;
	
	// Hide "now playing" if track is cleared
	$: if (!currentTrackData) {
		showNowPlaying = false;
	}
	
	// Derived values for display
	$: nowPlayingLink = currentTrackData && currentTrackData.type === 'local' ? currentTrackData.content : '';
	$: nowPlayingName = currentTrackData ? currentTrackData.name : '';
	$: currentTime = progress.currentTime;
	$: duration = progress.duration;
	$: seekValue = progress.seekValue;

	// Touch gesture detection variables
	let touchStartY = 0;
	let touchStartX = 0;
	let touchEndY = 0;
	let touchEndX = 0;
	const TOUCH_THRESHOLD = 10; // pixels - if movement exceeds this, it's a scroll, not a tap

	const handleToggle = () => {
		isExpanded = !isExpanded;
	};

	function initializeQueue() {
		const tracksWithType = music.map(track => ({
			...track,
			type: 'local'
		}));

		const currentState = musicStore.getCurrentState();

		// If music is currently playing from local files, and the current track is still in the new queue,
		// we don't need to re-set the entire queue immediately. The queue will be updated when a new track is selected.
		if (currentState.currentTrack && currentState.serviceType === 'local' && currentState.isPlaying) {
			const currentTrackInNewQueue = tracksWithType.some(t => t.content === currentState.currentTrack.content);
			if (currentTrackInNewQueue) {
				// If the current track is still in the new queue, we can update the queue.
				// This won't stop playback as the current track's index will remain valid.
				musicStore.setQueue(tracksWithType);
			}
			// If current track is NOT in new queue, we explicitly do NOT update the queue
			// to avoid stopping playback. The user will have to select a new track.
		} else {
			// No track playing, or playing from a different service, or current track is not local.
			// It's safe to set the queue.
			musicStore.setQueue(tracksWithType);
		}
	}

	async function playSong(index) {
		const currentState = musicStore.getCurrentState();
		
		// Ensure queue is initialized before playing
		if (currentState.queue.length === 0) {
			initializeQueue();
		}
		
		const updatedState = musicStore.getCurrentState();
		if (index >= 0 && index < updatedState.queue.length) {
			const track = updatedState.queue[index];
			await musicStore.playTrack(track, index);
			showNowPlaying = true; // Show "now playing" view when a track starts
			isExpanded = false;
		}
	}

	async function playNext() {
		await musicStore.playNext();
	}

	async function playPrevious() {
		await musicStore.playPrevious();
	}

	async function togglePlayPause() {
		await musicStore.togglePlayPause();
	}

	async function handleSeek(event) {
		await musicStore.seek(event.target.value);
	}

	function formatTime(seconds) {
		const mins = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60);
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	}

	function closePage() {
		isUnmounting = true;
		setTimeout(() => {
			isExpanded = false;
			setTimeout(() => {
				isExiting = true;
				setTimeout(() => {
					goto('/');
				}, 200); // Match the animation duration
			}, 300); // Allow time for bottom controls to collapse
		}, 300); // Allow time for unmounting animation
	}

	onMount(() => {
		music = fetchMusic(kernel.fs.getFiles());
		music = music.sort((a, b) => a.name.localeCompare(b.name));
		music.forEach((song) => {
			const firstLetter = song.name.charAt(0).toUpperCase();
			if (musicList[firstLetter]) {
				musicList[firstLetter].push(song);
			} else {
				musicList[firstLetter] = [song];
			}
		});
		
		// Check if music is already playing before initializing queue
		const currentState = musicStore.getCurrentState();
		
		// Only initialize queue if music is NOT currently playing
		// This prevents stopping playback when opening the app
		if (!currentState.isPlaying || currentState.serviceType !== 'local') {
			// No music playing or playing from different service, safe to initialize queue
			initializeQueue();
		}
		// If music is playing, skip queue initialization to avoid disrupting playback
		// The queue will be initialized when user selects a new track or when music stops
		
		isExpanded = false;
	});

	onDestroy(() => {
		// Cleanup is handled by the music store
	});

	async function scrollToChar(char) {
		await tick();
		const targetElement = document.getElementById(char);
		console.log(targetElement);
		if (targetElement) {
			targetElement.scrollIntoView({ behavior: 'instant' });
		}
	}

	function handleLetterClick(char) {
		targetChar = char;
		isExiting = true;
		setTimeout(
			() => {
				const targetId = char.toUpperCase();
				scrollToChar(targetId);
				showGrid = false;
				isExiting = false;
			},
			27 * 10 + 200 // 27 letters in the grid
		); // Wait for all animations to complete
		targetChar = '';
	}

	async function handleSongTap(song) {
		// Only play if it's a genuine tap (not a scroll)
		if (isTap()) {
			const currentState = musicStore.getCurrentState();
			const songIndex = currentState.queue.findIndex((s) => s.name === song.name);
			if (songIndex !== -1) {
				await playSong(songIndex);
			}
		}
	}

	// Touch gesture handlers
	function handleTouchStart(event) {
		touchStartY = event.touches[0].clientY;
		touchStartX = event.touches[0].clientX;
	}

	function handleTouchEnd(event) {
		touchEndY = event.changedTouches[0].clientY;
		touchEndX = event.changedTouches[0].clientX;
	}

	function isTap() {
		const deltaY = Math.abs(touchEndY - touchStartY);
		const deltaX = Math.abs(touchEndX - touchStartX);
		return deltaY < TOUCH_THRESHOLD && deltaX < TOUCH_THRESHOLD;
	}

	let targetChar = '';
</script>

<div class="page-holder" style="--accent-color: {accentColor};">
	{#if currentTrackData && currentTrackData.type === 'local' && showNowPlaying}
		<div
			class="flex flex-col pt-4 w-full font-[400] h-screen page px-4"
			class:page-exit={isExiting}
		>
			<span class="text-6xl font-[300] h-[10%]"> music </span>
			<div class="flex flex-col gap-2 mb-16">
				<span class="text-4xl font-[300]"> now playing </span>
				<div class="flex w-72 h-72 bg-gray-500 justify-center items-center mt-4">
					<Icon icon="mdi:headphones" width="168" height="168" />
				</div>

				<!-- Seek Bar -->
				<div class="flex flex-col gap-2 w-72 max-w-md">
					<div class="flex justify-between text-sm text-gray-400">
						<span>{formatTime(currentTime)}</span>
						<span>{formatTime(duration)}</span>
					</div>
					<div class="relative w-full h-2 bg-gray-200">
						<div
							class="absolute top-0 left-0 h-full transition-all duration-100 ease-in-out"
							style="width: {seekValue}%; background-color: {accentColor};"
						></div>
						<input
							type="range"
							min="0"
							max="100"
							value={seekValue}
							on:input={handleSeek}
							class="absolute top-0 left-0 w-full h-2 opacity-0 cursor-pointer slider"
						/>
					</div>
				</div>
				<span class="text-2xl font-[300] mt-2"> {nowPlayingName} </span>

				<div class="flex flex-row justify-between mt-6 w-72">
					<button
						class="flex flex-row gap-4 items-center border-2 border-white rounded-full p-2"
						on:click={playPrevious}
					>
						<Icon icon="mdi:skip-previous" width="32" height="32" />
					</button>
					<button
						class="flex flex-row gap-4 items-center border-2 border-white rounded-full p-2"
						on:click={togglePlayPause}
					>
						<Icon icon={isPlayingState ? 'mdi:pause' : 'mdi:play'} width="32" height="32" />
					</button>
					<button
						class="flex flex-row gap-4 items-center border-2 border-white rounded-full p-2"
						on:click={playNext}
					>
						<Icon icon="mdi:skip-next" width="32" height="32" />
					</button>
				</div>

				<!-- Audio element is now in the layout component for persistence -->
			</div>
		</div>
	{:else if showGrid}
		<LetterGrid
			items={music}
			itemNameKey="name"
			{showGrid}
			{isExiting}
			onLetterClick={handleLetterClick}
		/>
	{:else}
		<div
			class="flex flex-col pt-4 w-full font-[400] h-screen page px-4"
			class:page-exit={isExiting}
		>
			<span class="text-6xl font-[300] h-[10%]"> music </span>
			<div class="flex flex-col gap-8 pb-16 mt-6 overflow-y-auto">
				{#each Object.entries(musicList) as musicEntry}
					<div class="flex flex-col gap-6">
						<button
							class="{textClass} text-3xl lowercase border-2 w-12 h-12 justify-start items-end flex pl-1 pb-1 font-[300]"
							style="background-color: {accentColor}; border-color: {accentColor};"
							id={musicEntry[0].toUpperCase()}
							on:click={() => {
								showGrid = true;
							}}
							on:touchstart={handleTouchStart}
							on:touchend={(event) => {
								handleTouchEnd(event);
								if (isTap()) {
									showGrid = true;
								}
							}}
						>
							{musicEntry[0]}
						</button>
						{#each musicEntry[1] as song}
							<button
								class="flex flex-row gap-4 items-center"
								on:click={async () => {
									const currentState = musicStore.getCurrentState();
									const songIndex = currentState.queue.findIndex((s) => s.name === song.name);
									if (songIndex !== -1) {
										await playSong(songIndex);
									}
								}}
								on:touchstart={handleTouchStart}
								on:touchend={(event) => {
									handleTouchEnd(event);
									handleSongTap(song);
								}}
							>
								<span
									class="p-1 flex justify-center items-center rounded-full border-2 border-white"
								>
									<Icon icon="mdi:play" width="26" height="26" />
								</span>
								<span class="text-2xl font-[300] truncate max-w-64" title={song.name}
									>{song.name}</span
								>
							</button>
						{/each}
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>

<BottomControls expanded={isExpanded} unmounting={isUnmounting} on:toggle={handleToggle}>
	<div class="flex flex-row gap-12 w-full justify-center items-center">
		{#if nowPlayingLink}
			<div
				class="btn-animate flex flex-col gap-2 justify-center items-center"
				class:animate={isExpanded}
			>
				<button
					class="flex flex-col border border-white rounded-full !border-2 p-2 font-bold"
					on:click={() => {
						isExpanded = false;
						showNowPlaying = false; // Hide "now playing" view, but keep music playing
					}}
				>
					<Icon icon="subway:left-arrow" width="18" height="18" strokeWidth="2" />
				</button>
				<span class="text-xs font-[400]">library</span>
			</div>
		{/if}
		<div
			class="btn-animate flex flex-col gap-2 justify-center items-center"
			class:animate={isExpanded}
		>
			<button
				on:click={closePage}
				class="flex flex-col border border-white rounded-full !border-2 p-2 font-bold"
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

	/* Custom slider styles */
	.slider {
		-webkit-appearance: none;
		appearance: none;
		background: transparent;
		cursor: pointer;
	}

	.slider::-webkit-slider-track {
		background: #e5e7eb;
		height: 8px;
		border-radius: 4px;
	}

	.slider::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		background: var(--accent-color);
		height: 16px;
		width: 16px;
		border-radius: 50%;
		cursor: pointer;
	}

	.slider::-moz-range-track {
		background: #e5e7eb;
		height: 8px;
		border-radius: 4px;
		border: none;
	}

	.slider::-moz-range-thumb {
		background: var(--accent-color);
		height: 16px;
		width: 16px;
		border-radius: 50%;
		cursor: pointer;
		border: none;
	}
</style>
