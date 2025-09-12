<script>
	import { onMount, onDestroy, tick } from 'svelte';
	import { goto } from '$app/navigation';
	import Icon from '@iconify/svelte';
	import BottomControls from '../../components/BottomControls.svelte';
	import { fetchMusic } from '../../kernel/system-utils';
	import { kernel } from '../../kernel/store';
	import LetterGrid from '../../components/LetterGrid.svelte';

	let isExpanded = false;
	let isUnmounting = false;
	let isExiting = false;
	let music = [];
	const musicList = {};
	let showGrid = false;
	let nowPlayingLink = '';
	let nowPlayingName = '';
	let currentSongIndex = -1;
	let queue = [];
	let audioElement;
	let isPlaying = false;
	let currentTime = 0;
	let duration = 0;
	let seekValue = 0;

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
		queue = music;
	}

	function playSong(index) {
		if (index >= 0 && index < queue.length) {
			currentSongIndex = index;
			nowPlayingLink = queue[index].content;
			nowPlayingName = queue[index].name;
			isPlaying = true;
			isExpanded = false;

			// Reset seek bar values for new song
			currentTime = 0;
			duration = 0;
			seekValue = 0;

			// Force audio element to reload with new source
			if (audioElement) {
				audioElement.load();
			}
		}
	}

	function playNext() {
		if (queue.length > 0) {
			const nextIndex = (currentSongIndex + 1) % queue.length; // Cyclic
			console.log('Playing next song, index:', nextIndex, 'song:', queue[nextIndex]?.name);
			playSong(nextIndex);
		}
	}

	function playPrevious() {
		if (queue.length > 0) {
			const prevIndex = currentSongIndex <= 0 ? queue.length - 1 : currentSongIndex - 1; // Cyclic
			playSong(prevIndex);
		}
	}

	function togglePlayPause() {
		if (audioElement) {
			if (isPlaying) {
				audioElement.pause();
			} else {
				audioElement.play();
			}
			isPlaying = !isPlaying;
		}
	}

	function handleSeek(event) {
		if (audioElement && duration > 0) {
			const newTime = (event.target.value / 100) * duration;
			audioElement.currentTime = newTime;
			currentTime = newTime;
			seekValue = event.target.value;
		}
	}

	function formatTime(seconds) {
		const mins = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60);
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	}

	// Fallback timer to check if song ended
	let endCheckTimer;
	$: if (audioElement && isPlaying && duration > 0) {
		clearInterval(endCheckTimer);
		endCheckTimer = setInterval(() => {
			if (audioElement && audioElement.currentTime >= duration - 0.1) {
				console.log('Song ended (timer check), playing next...');
				clearInterval(endCheckTimer);
				playNext();
			}
		}, 1000);
	}

	// Reactive statement to update duration when audio element changes
	$: if (audioElement && audioElement.duration && audioElement.duration !== duration) {
		duration = audioElement.duration;
		console.log('Duration updated reactively:', duration);
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
		initializeQueue();
		isExpanded = false;
	});

	// Cleanup timer on component destroy
	onDestroy(() => {
		if (endCheckTimer) {
			clearInterval(endCheckTimer);
		}
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

	function handleSongTap(song) {
		// Only play if it's a genuine tap (not a scroll)
		if (isTap()) {
			const songIndex = queue.findIndex((s) => s.name === song.name);
			if (songIndex !== -1) {
				playSong(songIndex);
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

	$: console.log(nowPlayingLink);
</script>

<div class="page-holder">
	{#if nowPlayingLink}
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
							class="absolute top-0 left-0 h-full bg-[#ff00ff] transition-all duration-100 ease-in-out"
							style="width: {seekValue}%"
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
						<Icon icon="subway:left-arrow" width="32" height="32" />
					</button>
					<button
						class="flex flex-row gap-4 items-center border-2 border-white rounded-full p-2"
						on:click={togglePlayPause}
					>
						<Icon icon={isPlaying ? 'mdi:pause' : 'mdi:play'} width="32" height="32" />
					</button>
					<button
						class="flex flex-row gap-4 items-center border-2 border-white rounded-full p-2"
						on:click={playNext}
					>
						<Icon icon="mdi:skip-next" width="32" height="32" />
					</button>
				</div>

				<audio
					bind:this={audioElement}
					src={nowPlayingLink}
					autoplay
					on:loadedmetadata={() => {
						if (audioElement) {
							duration = audioElement.duration;
							console.log('Audio loaded, duration:', duration, 'for song:', nowPlayingName);
						}
					}}
					on:canplay={() => {
						if (audioElement) {
							duration = audioElement.duration;
							console.log('Audio can play, duration:', duration, 'for song:', nowPlayingName);
						}
					}}
					on:timeupdate={() => {
						if (audioElement && duration > 0) {
							currentTime = audioElement.currentTime;
							seekValue = (currentTime / duration) * 100;
						}
					}}
					on:ended={() => {
						console.log('Song ended, playing next...');
						playNext(); // Auto-play next song when current ends
					}}
					on:error={(e) => {
						console.error('Audio error:', e);
						// If there's an error, try to play next song
						playNext();
					}}
				></audio>
			</div>
		</div>
	{:else}
		<div>
			{#if showGrid}
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
									class="text-white text-3xl lowercase border-2 w-12 h-12 bg-[#ff00ff] border-[#ff00ff] justify-start items-end flex pl-1 pb-1 font-[300]"
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
										on:click={() => {
											const songIndex = queue.findIndex((s) => s.name === song.name);
											if (songIndex !== -1) {
												playSong(songIndex);
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
						nowPlayingLink = '';
						nowPlayingName = '';
						isPlaying = false;
						currentTime = 0;
						duration = 0;
						seekValue = 0;
					}}
				>
					<Icon icon="subway:left-arrow" width="18" height="18" strokeWidth="2" />
				</button>
				<span class="text-xs font-[400]">previous</span>
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
		background: #ff00ff;
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
		background: #ff00ff;
		height: 16px;
		width: 16px;
		border-radius: 50%;
		cursor: pointer;
		border: none;
	}
</style>
