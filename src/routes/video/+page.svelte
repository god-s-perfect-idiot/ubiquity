<script>
	import { kernel } from '../../kernel/store';
	import { fetchVideos, getVideoProvider } from '../../kernel/system-utils';
	import { onMount } from 'svelte';
	import Icon from '@iconify/svelte';
	import LetterGrid from '../../components/LetterGrid.svelte';
	import BottomControls from '../../components/BottomControls.svelte';
	import { goto } from '$app/navigation';

	let isExpanded = false;
	let isUnmounting = false;
	let isExiting = false;
	let videos = [];
	let selectedLetter = '';
	let videoList = {};
	let showGrid = false;
	let nowPlayingLink = '';
	let nowPlayingName = '';
	let isPlaying = false;
	let videoElement;
	let isVideoPaused = false;
	let currentTime = 0;
	let duration = 0;

	onMount(() => {
		videos = fetchVideos(kernel.fs.getFiles());
		console.log('Fetched videos:', videos);

		// Organize videos by first letter
		videos.forEach((video) => {
			const firstLetter = video.name.charAt(0).toUpperCase();
			if (videoList[firstLetter]) {
				videoList[firstLetter].push(video);
			} else {
				videoList[firstLetter] = [video];
			}
		});
	});

	const handleToggle = () => {
		isExpanded = !isExpanded;
	};

	const handleLetterClick = (letter) => {
		selectedLetter = letter;
		showGrid = false;
	};

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

	function playVideo(index) {
		if (index >= 0 && index < videos.length) {
			nowPlayingLink = videos[index].content;
			nowPlayingName = videos[index].name;
			isPlaying = true;
			isUnmounting = true;
		}
	}

	function closeVideoPlayer() {
		isPlaying = false;
		nowPlayingLink = '';
		nowPlayingName = '';
		isUnmounting = false;
		isVideoPaused = false;
		currentTime = 0;
		duration = 0;
	}

	function togglePlayPause() {
		if (videoElement) {
			if (isVideoPaused) {
				videoElement.play();
			} else {
				videoElement.pause();
			}
			isVideoPaused = !isVideoPaused;
		}
	}

	function skipBackward() {
		if (videoElement) {
			videoElement.currentTime = Math.max(0, videoElement.currentTime - 10);
		}
	}

	function skipForward() {
		if (videoElement) {
			videoElement.currentTime = Math.min(videoElement.duration, videoElement.currentTime + 10);
		}
	}

	function handleTimeUpdate() {
		if (videoElement) {
			currentTime = videoElement.currentTime;
			duration = videoElement.duration;
		}
	}

	function handleSeek(event) {
		if (videoElement) {
			const rect = event.currentTarget.getBoundingClientRect();
			const clickX = event.clientX - rect.left;
			const percentage = clickX / rect.width;
			videoElement.currentTime = percentage * videoElement.duration;
		}
	}
</script>

{#if isPlaying}
	<!-- Full-screen video player -->
	<div class="fixed inset-0 bg-black z-50 flex items-center justify-center page-holder">
		<div class="relative w-full h-full page overflow-hidden" class:page-exit={isExiting}>
			<div
				class="absolute top-4 right-4 w-screen bg-black bg-opacity-50 text-white px-4 py-2 rounded"
			>
				<span class="px-4 text-2xl">{nowPlayingName}</span>
			</div>

			<!-- Video container -->
			<div class="w-full h-full flex items-center justify-center">
				<video
					bind:this={videoElement}
					src={nowPlayingLink}
					autoplay
					class="w-full h-full object-contain"
					on:click={(e) => e.stopPropagation()}
					on:timeupdate={handleTimeUpdate}
					on:loadedmetadata={handleTimeUpdate}
				>
					Your browser does not support the video tag.
				</video>
			</div>

			<!-- Video controls overlay -->
			<div class="absolute bottom-0 left-0 right-0 bg-black bg-opacity-80 text-white p-4">
				<div class="flex flex-col gap-4 mb-4">
					<!-- Row 1: Seekbar -->
					<div class="w-full">
						<div class="h-[3px] bg-gray-600 rounded-full cursor-pointer relative" on:click={handleSeek}>
							<div
								class="h-full bg-white rounded-full transition-all duration-100 relative"
								style="width: {duration > 0 ? (currentTime / duration) * 100 : 0}%"
							>
								<div
									class="absolute right-0 top-1/2 transform -translate-y-1/2 w-5 h-5 bg-white rounded-full border-2 border-gray-600"
								></div>
							</div>
						</div>
					</div>

					<!-- Row 2: Time values -->
					<div class="flex justify-center items-center gap-1 self-end">
						<span class="text-sm font-mono">
							{Math.floor(currentTime / 60)}:{(currentTime % 60).toFixed(0).padStart(2, '0')}
						</span>
						<span class="text-sm font-mono"> / </span>
						<span class="text-sm font-mono">
							{Math.floor(duration / 60)}:{(duration % 60).toFixed(0).padStart(2, '0')}
						</span>
					</div>

					<!-- Row 3: Controls -->
					<div class="flex justify-center items-center gap-8">
						<button
							on:click={togglePlayPause}
							class="bg-black border-2 border-white rounded-full bg-opacity-50 hover:bg-opacity-75 text-white rounded-full p-2 transition-all duration-200"
						>
							<Icon icon={isVideoPaused ? 'mdi:play' : 'mdi:pause'} width="24" height="24" />
						</button>
						<button
							on:click={skipBackward}
							class="bg-black border-2 border-white rounded-full bg-opacity-50 hover:bg-opacity-75 text-white rounded-full p-2 transition-all duration-200"
						>
							<Icon icon="mdi:rewind-10" width="24" height="24" />
						</button>

						<button
							on:click={skipForward}
							class="bg-black border-2 border-white rounded-full bg-opacity-50 hover:bg-opacity-75 text-white rounded-full p-2 transition-all duration-200"
						>
							<Icon icon="mdi:fast-forward-10" width="24" height="24" />
						</button>

						<button
							on:click={closeVideoPlayer}
							class="bg-black border-2 border-white rounded-full bg-opacity-50 hover:bg-opacity-75 text-white rounded-full p-2 transition-all duration-200"
						>
							<Icon icon="carbon:close" width="24" height="24" />
						</button>
					</div>
				</div>
			</div>
		</div>
	</div>
{:else if showGrid}
	<LetterGrid
		items={videos}
		itemNameKey="name"
		{showGrid}
		{isExiting}
		onLetterClick={handleLetterClick}
	/>
{:else}
	<div class="page-holder">
		<div
			class="flex flex-col pt-4 w-full font-[400] h-screen page px-4"
			class:page-exit={isExiting}
		>
			<span class="text-6xl font-[300] h-[10%]"> videos </span>
			<div class="flex flex-col gap-8 pb-16 mt-6 overflow-y-auto">
				{#each Object.entries(videoList) as videoEntry}
					<div class="flex flex-col gap-6">
						<button
							class="text-white text-3xl lowercase border-2 w-12 h-12 bg-[#ff00ff] border-[#ff00ff] justify-start items-end flex pl-1 pb-1 font-[300]"
							id={videoEntry[0].toUpperCase()}
							on:click={() => {
								showGrid = true;
							}}
						>
							{videoEntry[0]}
						</button>
						<div class="flex flex-col gap-4">
							{#each videoEntry[1] as video}
								<button
									class="flex flex-row gap-4 items-start"
									on:click={() => {
										const videoIndex = videos.findIndex((v) => v.name === video.name);
										if (videoIndex !== -1) {
											playVideo(videoIndex);
										}
									}}
								>
									<div
										class="relative w-20 h-20 overflow-hidden border-2 border-white flex-shrink-0 flex items-center justify-center"
									>
										<span class="absolute bottom-2 right-2 rounded-full border-2 border-white p-1">
											<Icon icon="mdi:play" width="20" height="20" class="text-white" />
										</span>
									</div>
									<div class="flex flex-col gap-2 justify-start">
										<span
											class="text-2xl pt-2 font-[300] truncate max-w-64 w-full flex justify-start"
											title={video.name}>{video.name}</span
										>
										<span class="text-sm font-[300] text-gray-400 capitalize justify-start flex">
											{getVideoProvider(video)}
										</span>
									</div>
								</button>
							{/each}
						</div>
					</div>
				{/each}
			</div>
		</div>
	</div>
{/if}

<BottomControls expanded={isExpanded} unmounting={isUnmounting} on:toggle={handleToggle}>
	<div class="flex flex-row gap-12 w-full justify-center items-center">
		<div
			class="btn-animate flex flex-col gap-2 justify-center items-center"
			class:animate={isExpanded}
		>
			<button
				on:click={closePage}
				class="flex flex-col border border-white rounded-full !border-2 p-1 font-bold"
			>
				<Icon icon="carbon:close" width="20" height="20" />
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
</style>
