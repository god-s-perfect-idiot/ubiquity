<script>
	import BottomControls from '../../components/BottomControls.svelte';
	import { kernel } from '../../kernel/store';
	import { goto } from '$app/navigation';
	import Icon from '@iconify/svelte';
	import { onMount, onDestroy } from 'svelte';
	import { backgroundClassStore, textColorClassStore } from '../../utils/theme';
	import { addToast } from '../../store/toast';
	import Button from '../../components/Button.svelte';
	import { lensStore } from '../../store/lenses';
	import LensGrid from '../../components/LensGrid.svelte';
	import { applyLensEffect } from '../../utils/lens-effects';

	let isExpanded = false;
	let isUnmounting = false;
	let isExiting = false;
	let stream = null;
	let videoElement = null;
	let canvasElement = null;
	let canvasCtx = null;
	let renderAnimationFrame = null;
	let capturedImage = null;
	let error = null;
	let isCapturing = false;
	let isDimmed = false;
	let isUploading = false;
	let uploadError = null;
	let facingMode = 'environment'; // 'user' for front camera, 'environment' for back camera
	let showLensGrid = false;
	let cameraViewportExiting = false;
	let cameraViewportEntering = false;

	$: bgClass = $backgroundClassStore;
	$: textClass = $textColorClassStore;
	
	// Subscribe to lens store reactively
	$: lensState = $lensStore;
	$: selectedLens = lensState.lenses?.find(l => l.id === lensState.selectedLensId) || lensState.lenses?.[0] || { cssFilter: 'none' };
	$: videoFilter = selectedLens?.cssFilter || 'none';
	$: needsCanvasEffect = selectedLens?.applyFunction !== null && selectedLens?.applyFunction !== undefined;

	function playShutterSound() {
		try {
			const audio = new Audio('/shutter.mp3');
			audio.volume = 0.7;
			audio.play().catch((err) => {
				console.warn('Could not play shutter sound:', err);
			});
		} catch (err) {
			console.warn('Could not play shutter sound:', err);
		}
	}

	async function startCamera() {
		try {
			error = null;
			const constraints = {
				video: {
					facingMode: facingMode,
					width: { ideal: 1920 },
					height: { ideal: 1080 }
				}
			};

			stream = await navigator.mediaDevices.getUserMedia(constraints);
			if (videoElement) {
				videoElement.srcObject = stream;
			}
		} catch (err) {
			console.error('Error accessing camera:', err);
			error = err.message || 'Failed to access camera';
		}
	}

	function stopCamera() {
		// Stop render loop
		if (renderAnimationFrame !== null) {
			cancelAnimationFrame(renderAnimationFrame);
			renderAnimationFrame = null;
		}
		
		if (stream) {
			stream.getTracks().forEach((track) => track.stop());
			stream = null;
		}
		if (videoElement) {
			videoElement.srcObject = null;
		}
	}

	async function uploadImage(imageData) {
		try {
			isUploading = true;
			uploadError = null;

			// Get API key from localStorage
			const apiKey = localStorage.getItem('imgbb_api_key');

			if (!apiKey) {
				throw new Error(
					'ImgBB API key not configured. Please set it up in Settings > Accounts > ImgBB.'
				);
			}

			const response = await fetch('/api/imgbb/upload', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ image: imageData, apiKey })
			});

			const data = await response.json();

			if (!data.success) {
				throw new Error(data.error || 'Failed to upload image');
			}

			console.log('Image uploaded successfully:', data.url);

			// Add image to photos system
			const timestamp = new Date();
			const fileName = `photo-${timestamp.getFullYear()}-${String(timestamp.getMonth() + 1).padStart(2, '0')}-${String(timestamp.getDate()).padStart(2, '0')}-${String(timestamp.getHours()).padStart(2, '0')}-${String(timestamp.getMinutes()).padStart(2, '0')}-${String(timestamp.getSeconds()).padStart(2, '0')}.jpg`;
			kernel.addFile(fileName, data.url, 'image');
			kernel.updateFS();

			addToast('Photo saved successfully', 2000);
			return data.url;
		} catch (error) {
			console.error('Error uploading image:', error);
			uploadError = error.message;
			addToast('Failed to save photo: ' + error.message, 3000);
			throw error;
		} finally {
			isUploading = false;
		}
	}

	async function capturePhoto() {
		if (!videoElement || !stream) return;

		isCapturing = true;
		const canvas = document.createElement('canvas');
		canvas.width = videoElement.videoWidth;
		canvas.height = videoElement.videoHeight;
		const ctx = canvas.getContext('2d');
		ctx.drawImage(videoElement, 0, 0);

		// Apply lens effect to captured image if needed
		if (selectedLens && selectedLens.applyFunction) {
			applyLensEffect(canvas, selectedLens);
		}

		capturedImage = canvas.toDataURL('image/jpeg', 0.9);
		isCapturing = false;

		// Play shutter sound
		playShutterSound();

		// Dim the screen briefly
		isDimmed = true;

		// Upload image in the background
		try {
			await uploadImage(capturedImage);
		} catch (error) {
			// Error is already logged and stored in uploadError
			// User can continue using camera even if upload fails
		}

		setTimeout(() => {
			isDimmed = false;
			capturedImage = null; // Clear after dimming
		}, 200);
	}

	async function switchCamera() {
		stopCamera();
		facingMode = facingMode === 'user' ? 'environment' : 'user';
		await startCamera();
	}

	const handleToggle = () => {
		isExpanded = !isExpanded;
	};

	function closePage() {
		isUnmounting = true;
		stopCamera();
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

	function goBack() {
		goto('/');
	}

    function openGallery() {
        goto('/photos');
    }

    function comingSoon() {
        addToast('Coming soon');
    }

	function openLensGrid() {
		// Ensure any previous enter state is cleared
		cameraViewportEntering = false;
		
		// Start exit animation - viewport pivots out (away from screen)
		cameraViewportExiting = true;
		
		// Wait for exit animation to be visible, then show the grid sliding in
		setTimeout(() => {
			showLensGrid = true;
		}, 100); // Give exit animation time to be visible
	}

	function closeLensGrid() {
		// Start bringing the viewport back in - pivot from rotated state back to normal
		
		// First, ensure we're not in enter state
		cameraViewportEntering = false;
		
		// Remove exit state - this allows the element to be in rotated state (from exit animation)
		cameraViewportExiting = false;
		
		// Use requestAnimationFrame to ensure DOM updates, then trigger enter animation
		requestAnimationFrame(() => {
			requestAnimationFrame(() => {
				// Start enter animation - viewport pivots back in (from 90deg to 0deg)
				cameraViewportEntering = true;
				
				// Remove entering class after animation completes
				setTimeout(() => {
					cameraViewportEntering = false;
				}, 200);
			});
		});
	}
	
	function hideLensGrid() {
		// Called after tiles finish sliding out to actually hide the grid
		showLensGrid = false;
	}

	function handleLensSelect(lens) {
		// Lens is already selected by the store in LensGrid component
		// The lens grid will handle sliding out first, then call closeLensGrid
	}

	// Render loop for canvas-based lens effects
	function renderVideoToCanvas() {
		if (!videoElement || !canvasElement || !needsCanvasEffect) {
			// Stop render loop if not needed
			if (renderAnimationFrame !== null) {
				cancelAnimationFrame(renderAnimationFrame);
				renderAnimationFrame = null;
			}
			return;
		}

		const videoWidth = videoElement.videoWidth;
		const videoHeight = videoElement.videoHeight;

		if (videoWidth === 0 || videoHeight === 0) {
			// Video not ready yet, try again next frame
			renderAnimationFrame = requestAnimationFrame(renderVideoToCanvas);
			return;
		}

		// Get container dimensions for display
		const container = canvasElement.parentElement;
		if (!container) {
			renderAnimationFrame = requestAnimationFrame(renderVideoToCanvas);
			return;
		}

		const displayWidth = container.clientWidth;
		const displayHeight = container.clientHeight;

		// Set canvas display size (CSS size)
		canvasElement.style.width = `${displayWidth}px`;
		canvasElement.style.height = `${displayHeight}px`;

		// Set canvas internal resolution to match video (for better quality)
		if (canvasElement.width !== videoWidth || canvasElement.height !== videoHeight) {
			canvasElement.width = videoWidth;
			canvasElement.height = videoHeight;
			canvasCtx = canvasElement.getContext('2d');
		}

		if (!canvasCtx) {
			canvasCtx = canvasElement.getContext('2d');
		}

		// Draw video frame to canvas at full resolution
		canvasCtx.drawImage(videoElement, 0, 0, videoWidth, videoHeight);

		// Apply lens effect (works on the full resolution canvas)
		if (selectedLens && selectedLens.applyFunction) {
			applyLensEffect(canvasElement, selectedLens);
		}

		// Continue render loop
		renderAnimationFrame = requestAnimationFrame(renderVideoToCanvas);
	}

	// Start/stop render loop based on whether canvas effect is needed
	$: if (needsCanvasEffect && videoElement && canvasElement && stream) {
		// Wait a bit for video to be ready, then start render loop
		if (renderAnimationFrame === null) {
			setTimeout(() => {
				if (videoElement && videoElement.videoWidth > 0 && renderAnimationFrame === null) {
					renderVideoToCanvas();
				}
			}, 100);
		}
	} else {
		if (renderAnimationFrame !== null) {
			cancelAnimationFrame(renderAnimationFrame);
			renderAnimationFrame = null;
		}
	}

	onMount(async () => {
		isExpanded = false;
		await startCamera();
	});

	onDestroy(() => {
		stopCamera();
	});
</script>

<div class="page-holder">
	<div 
		class="flex flex-col w-full font-[400] h-screen page" 
		class:page-exit={isExiting || cameraViewportExiting}
		class:camera-viewport-exit={cameraViewportExiting}
		class:page-enter={cameraViewportEntering}
	>
		<div class="flex-1 relative overflow-hidden">
			{#if error}
				<div
					class="w-full h-full flex flex-col items-center justify-center {bgClass} {textClass} px-4"
				>
					<Icon icon="ri:camera-off-fill" width="64" height="64" class="opacity-70 mb-4" />
					<span class="text-lg font-[300] opacity-80 text-center">{error}</span>
					<Button text="retry" onClick={startCamera} className="mt-4" />
				</div>
			{:else}
				<!-- Camera view -->
				<div class="w-full h-full relative {bgClass}">
					<!-- Video element - always present to maintain stream connection -->
					<video 
						bind:this={videoElement} 
						autoplay 
						playsinline 
						class="w-full h-full object-cover"
						class:absolute={needsCanvasEffect}
						class:inset-0={needsCanvasEffect}
						class:opacity-0={needsCanvasEffect}
						class:pointer-events-none={needsCanvasEffect}
						style="filter: {videoFilter};"
					></video>

					<!-- Canvas overlay for lens effects that need canvas processing (e.g., pixel art) -->
					{#if needsCanvasEffect}
						<canvas
							bind:this={canvasElement}
							class="w-full h-full object-cover absolute inset-0"
						></canvas>
					{/if}

					<!-- Camera overlay frame -->
					<div class="absolute inset-0 pointer-events-none"></div>

					<!-- Dimming overlay -->
					{#if isDimmed}
						<div class="dim-overlay"></div>
					{/if}
				</div>
			{/if}
		</div>
	</div>
</div>

<div class="flex flex-col gap-2 justify-center items-center absolute bottom-4 left-0 right-0">
	<button
		on:click={capturePhoto}
		disabled={isCapturing || !stream}
		class="flex flex-col border border-white rounded-full !border-2 p-3 font-bold disabled:opacity-50"
	>
		<Icon icon="el:camera" width="48" height="48" strokeWidth="2" />
	</button>
</div>

<div
	class="flex flex-row w-full px-4 gap-2 justify-between items-center absolute top-4 left-0 right-0"
>
	<button
		on:click={goBack}
		class="flex flex-col border border-white rounded-full !border-2 p-2 font-bold"
	>
		<Icon icon="subway:left-arrow" width="24" height="24" strokeWidth="2" />
	</button>
	<button
		on:click={comingSoon}
		class="flex flex-col border border-white rounded-full !border-2 p-2 font-bold"
	>
		<Icon icon="pixel:pro-solid" width="24" height="24" strokeWidth="2" />
	</button>
	<button
		on:click={openLensGrid}
		class="flex flex-col border border-white rounded-full !border-2 p-2 font-bold"
	>
		<Icon icon="iconoir:lens" width="24" height="24" strokeWidth="2" />
	</button>
	<button
		on:click={switchCamera}
		class="flex flex-col border border-white rounded-full !border-2 p-2 font-bold"
	>
		<Icon icon="material-symbols:flip-camera-ios-sharp" width="24" height="24" strokeWidth="2" />
	</button>

	<button
    on:click={openGallery}
    class="flex flex-col border border-white rounded-full !border-2 p-2 font-bold"
>
    <Icon icon="nrk:gallery" width="24" height="24" strokeWidth="2" />
</button>
</div>

<!-- Lens Grid Modal -->
<LensGrid open={showLensGrid} onClose={closeLensGrid} onHide={hideLensGrid} onSelect={handleLensSelect} />

<style>
	.dim-overlay {
		position: absolute;
		inset: 0;
		background-color: black;
		opacity: 0;
		animation: dim-fade 0.2s ease-out;
		pointer-events: none;
	}

	@keyframes dim-fade {
		0% {
			opacity: 0;
		}
		50% {
			opacity: 0.8;
		}
		100% {
			opacity: 0;
		}
	}

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

	/* Override base page animations for camera viewport */
	/* Exit: pivot out (away from screen) - rotate to -90deg with perspective */
	.page.page-exit.camera-viewport-exit {
		transform-origin: left;
		animation: cameraPivotOut 0.2s ease-out forwards !important;
	}
	
	/* Enter: pivot in from front (like closing a door forward) - must override base .page animation */
	/* Pivot at left, door closes forward (right edge comes toward viewer from front) */
	.page.page-enter {
		transform-origin: left;
		transform: rotateY(90deg) translateZ(300px) !important; /* Start from front position (right edge forward, like open door) */
		animation: cameraPivotInFromFront 0.2s ease-out forwards !important;
	}
	
	@keyframes cameraPivotOut {
		from {
			transform: rotateY(0deg) translateZ(0px);
		}
		to {
			transform: rotateY(-90deg) translateZ(300px); /* Negative rotation = pivots out of screen (away) */
		}
	}
	
	@keyframes cameraPivotInFromFront {
		from {
			transform: rotateY(90deg) translateZ(300px); /* Start from front position (right edge forward, pivoted toward viewer) */
		}
		to {
			transform: rotateY(0deg) translateZ(0px); /* Pivot in from front (close door forward - toward viewer) */
		}
	}
</style>
