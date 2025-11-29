<script>
	import { onMount, onDestroy } from 'svelte';
	import Icon from '@iconify/svelte';
	import { kernel } from '../../kernel/store';
	import { fetchPhotos } from '../../kernel/system-utils';
	import { backgroundClassStore, textColorClassStore } from '../../utils/theme';

	// gridSize is kept for API compatibility but both sizes use the same single-image layout
	export let gridSize = '2x2'; // '2x2' or '4x2' - both use same single image layout

	$: textColor = $textColorClassStore;
	$: backgroundColor = $backgroundClassStore;

	let photos = [];
	let currentPhotoIndex = 0;
	let photoInterval = null;
	let photoCount = 0;
	let isTransitioning = false;
	let isPanning = false;
	let nextPhotoIndex = 0;
	let panTimeout = null;

	function clearPhotoInterval() {
		if (photoInterval) {
			clearInterval(photoInterval);
			photoInterval = null;
		}
	}

	function clearPanTimeout() {
		if (panTimeout) {
			clearTimeout(panTimeout);
			panTimeout = null;
		}
	}

	function getRandomPhotoIndex(excludeIndex) {
		if (photos.length <= 1) return 0;
		if (photos.length === 2) {
			// If only 2 photos, return the other one
			return excludeIndex === 0 ? 1 : 0;
		}
		// Get a random index that's different from the current one
		let randomIndex;
		do {
			randomIndex = Math.floor(Math.random() * photos.length);
		} while (randomIndex === excludeIndex);
		return randomIndex;
	}

	function startPhotoCycle() {
		if (photos.length <= 1) return;
		
		// Step 1: Show image static for 3 seconds
		setTimeout(() => {
			// Step 2: Start panning animation (5 seconds)
			isPanning = true;
			
			setTimeout(() => {
				// Step 3: Panning complete, start exit/enter transition
				isPanning = false;
				// Select a random photo (different from current)
				nextPhotoIndex = getRandomPhotoIndex(currentPhotoIndex);
				isTransitioning = true;
				
				setTimeout(() => {
					// Step 4: Transition complete, update to next photo and restart cycle
					currentPhotoIndex = nextPhotoIndex;
					isTransitioning = false;
					
					// Restart cycle for next photo
					startPhotoCycle();
				}, 600); // Transition duration (matches CSS animation)
			}, 5000); // Panning duration
		}, 3000); // Static display duration
	}

	function startPhotoInterval() {
		clearPhotoInterval();
		clearPanTimeout();
		
		if (photos.length > 1) {
			// Start the first cycle
			startPhotoCycle();
		}
	}

	function shuffleArray(array) {
		const shuffled = [...array];
		for (let i = shuffled.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
		}
		return shuffled;
	}

	onMount(() => {
		// Read photos only once on mount
		const files = kernel.fs.getFiles();
		const fetchedPhotos = fetchPhotos(files);
		// Shuffle the photos array to randomize the order
		photos = shuffleArray(fetchedPhotos);
		photoCount = photos.length;
		
		// Start with a random photo index
		if (photos.length > 0) {
			currentPhotoIndex = Math.floor(Math.random() * photos.length);
		}
		
		// Start photo rotation if we have multiple photos
		if (photos.length > 1) {
			startPhotoInterval();
		}
	});

	onDestroy(() => {
		// Clear interval
		clearPhotoInterval();
		clearPanTimeout();
		
		// Clear photos array to release memory
		photos = [];
		photoCount = 0;
		currentPhotoIndex = 0;
		isPanning = false;
		isTransitioning = false;
	});

	// Get current and next photo for transition
	$: currentPhoto = photos.length > 0 ? photos[currentPhotoIndex] : null;
	$: nextPhoto = photos.length > 1 && isTransitioning ? photos[nextPhotoIndex] : null;
</script>

{#if photos.length === 0}
	<!-- No photos state -->
	<div
		class="w-full h-full flex flex-col items-center justify-center text-white {textColor}"
		style="background: {backgroundColor};"
	>
		<Icon icon="tdesign:image-filled" width="48" height="48" class="opacity-70 mb-2" />
		<span class="text-lg font-[300] opacity-80">No photos</span>
	</div>
{:else if currentPhoto}
	<!-- Single image with panning and elastic transition -->
	<div
		class="w-full h-full overflow-hidden relative"
		style="background: {backgroundColor};"
	>
		<!-- Current photo with panning animation -->
		<div class="absolute inset-0 overflow-hidden {isTransitioning ? 'photo-exit-container' : ''}">
			<img
				src={currentPhoto.content}
				alt={currentPhoto.name}
				class="w-full h-full object-cover {isTransitioning ? 'photo-exit' : (isPanning ? 'photo-pan' : 'photo-static')}"
				loading="lazy"
			/>
		</div>
		
		<!-- Next photo entering from bottom - always render during transition to ensure stacking -->
		{#if isTransitioning && nextPhoto}
			<div class="absolute inset-0 overflow-hidden photo-enter-container">
				<img
					src={nextPhoto.content}
					alt={nextPhoto.name}
					class="w-full h-full object-cover photo-enter"
					loading="lazy"
				/>
			</div>
		{/if}
		
		<!-- Photo count overlay -->
		<div class="absolute bottom-2 left-2 z-10">
			<span class="text-sm font-medium text-white">Photos</span>
		</div>
	</div>
{/if}

<style>
	/* Static state - no animation, image positioned at top */
	.photo-static {
		object-position: center top;
	}

	/* Panning animation - slowly shifts object-position to reveal more of the image */
	/* This reveals more image content without exposing the background */
	@keyframes pan-up {
		0% {
			object-position: center top;
		}
		100% {
			/* Shift object-position down to reveal more of the image */
			/* This pans through the image content, not the container */
			object-position: center 30%;
		}
	}

	.photo-pan {
		animation: pan-up 5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
		/* Preserve the final object-position state */
		animation-fill-mode: forwards;
		/* Smooth rendering */
		will-change: object-position;
	}

	/* Exit container - ensures proper stacking during transition */
	.photo-exit-container {
		z-index: 2;
	}

	/* Simple exit animation - image exits upwards smoothly without bounce */
	/* Starts from panning end position */
	@keyframes exit-up {
		from {
			object-position: center 30%;
			transform: translateY(0);
		}
		to {
			object-position: center 30%;
			transform: translateY(-100%);
		}
	}

	.photo-exit {
		/* Set initial state to match panning end position */
		object-position: center 30%;
		transform: translateY(0);
		animation: exit-up 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
	}

	/* Enter container - ensures proper stacking during transition */
	.photo-enter-container {
		z-index: 1;
	}

	/* Enter animation - image enters from bottom */
	/* Replicates Windows Phone 8.1 gallery live tile animation behavior */
	/* Uses Windows Phone standard easing curve for smooth deceleration */
	@keyframes enter-from-bottom {
		0% {
			object-position: center top;
			transform: translateY(100%);
			opacity: 1;
		}
		100% {
			object-position: center top;
			transform: translateY(0);
			opacity: 1;
		}
	}

	.photo-enter {
		object-position: center top;
		animation: enter-from-bottom 0.6s cubic-bezier(0.1, 0, 0.25, 1) forwards;
	}
</style>

