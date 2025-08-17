<script>
	import { kernel } from '../../kernel/store';
	import { fetchVideos, generateThumbnail } from '../../kernel/system-utils';
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
	let currentTime = 0;
	let duration = 0;
	let seekValue = 0;
	let videoThumbnails = new Map();

	// Touch gesture detection variables
	let touchStartY = 0;
	let touchStartX = 0;
	let touchEndY = 0;
	let touchEndX = 0;
	const TOUCH_THRESHOLD = 10; // pixels - if movement exceeds this, it's a scroll, not a tap

	onMount(() => {
		videos = fetchVideos(kernel.fs.getFiles());
		console.log('Fetched videos:', videos);
		videos.forEach((video) => {
			const firstLetter = video.name.charAt(0).toUpperCase();
			if (videoList[firstLetter]) {
				videoList[firstLetter].push(video);
			} else {
				videoList[firstLetter] = [video];
			}
			// Generate thumbnail for the video
			console.log(
				'Attempting to generate thumbnail for:',
				video.name,
				'with content:',
				video.content
			);
			generateThumbnail(video)
				.then((thumbnailUrl) => {
					console.log('Successfully generated thumbnail for:', video.name);
					videoThumbnails.set(video.name, thumbnailUrl);
				})
				.catch((error) => {
					console.log('Failed to generate thumbnail for:', video.name, error);
					// Create a fallback colored placeholder
					const canvas = document.createElement('canvas');
					const ctx = canvas.getContext('2d');
					canvas.width = 120;
					canvas.height = 68;

					// Create a gradient background
					const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
					gradient.addColorStop(0, '#ff00ff');
					gradient.addColorStop(1, '#00ffff');
					ctx.fillStyle = gradient;
					ctx.fillRect(0, 0, canvas.width, canvas.height);

					// Add text
					ctx.fillStyle = 'white';
					ctx.font = '12px Arial';
					ctx.textAlign = 'center';
					ctx.fillText('VIDEO', canvas.width / 2, canvas.height / 2);

					const fallbackUrl = canvas.toDataURL('image/jpeg', 0.8);
					videoThumbnails.set(video.name, fallbackUrl);
				});
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
				}, 200); // Match the animation duration
			}, 300); // Allow time for bottom controls to collapse
		}, 300); // Allow time for unmounting animation
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

	function handleVideoTap(video) {
		// Only play if it's a genuine tap (not a scroll)
		if (isTap()) {
			const videoIndex = videos.findIndex((v) => v.name === video.name);
			if (videoIndex !== -1) {
				playVideo(videoIndex);
			}
		}
	}

	function playVideo(index) {
		if (index >= 0 && index < videos.length) {
			nowPlayingLink = videos[index].content;
			nowPlayingName = videos[index].name;
			isPlaying = true;
		}
	}
</script>

{#if showGrid}
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
							on:touchstart={handleTouchStart}
							on:touchend={(event) => {
								handleTouchEnd(event);
								if (isTap()) {
									showGrid = true;
								}
							}}
						>
							{videoEntry[0]}
						</button>
						<div class="flex flex-col gap-4">
							{#each videoEntry[1] as video}
								<button
									class="flex flex-row gap-4 items-center"
									on:click={() => {
										const videoIndex = videos.findIndex((v) => v.name === video.name);
										if (videoIndex !== -1) {
											playVideo(videoIndex);
										}
									}}
									on:touchstart={handleTouchStart}
									on:touchend={(event) => {
										handleTouchEnd(event);
										handleVideoTap(video);
									}}
								>
									<div
										class="relative w-20 h-20 overflow-hidden border-2 border-white flex-shrink-0"
									>
										{#if videoThumbnails.has(video.name)}
											<img
												src={videoThumbnails.get(video.name)}
												alt={video.name}
												class="w-full h-full object-cover"
											/>
										{:else}
											<div
												class="absolute bottom-2 right-2 flex justify-center items-center p-1 rounded-full border-2 border-white"
											>
												<Icon icon="mdi:play" width="20" height="20" />
											</div>
										{/if}
										<div
											class="absolute inset-0 bg-black bg-opacity-20 hover:bg-opacity-0 transition-all duration-200"
										></div>
									</div>
									<span class="text-2xl font-[300] truncate max-w-64" title={video.name}
										>{video.name}</span
									>
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
		<!-- {#if nowPlayingLink}
			<div
				class="btn-animate flex flex-col gap-2 justify-center items-center"
				class:animate={isExpanded}
			>
				<button
					class="flex flex-col border border-white rounded-full !border-2 p-1 font-bold"
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
					<Icon icon="mdi:skip-previous" width="20" height="20" strokeWidth="2" />
				</button>
				<span class="text-xs font-[400]">previous</span>
			</div>
		{/if} -->
		<div
			class="btn-animate flex flex-col gap-2 justify-center items-center"
			class:animate={isExpanded}
		>
			<button
				on:click={closePage}
				class="flex flex-col border border-white rounded-full !border-2 p-1 font-bold"
			>
				<Icon icon="carbon:close" width="20" height="20" strokeWidth="2" />
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
