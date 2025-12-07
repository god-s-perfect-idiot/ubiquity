<script>
	import Apps from './Apps.svelte';
	import StartMenu from './StartMenu.svelte';
	import { settingsStore } from '../store/settings';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { shouldShowOnboarding } from '../utils/onboarding';
	import { browser } from '$app/environment';
    
	// Initialize showMenu immediately using synchronous get to avoid animation on load
	const initialSetting = settingsStore.get('appearance.showHomescreenWhenOpened');
	let showMenu = initialSetting === true;
	let isAnimating = false;
	let userHasInteracted = false;
	let isInitialLoad = true;
	
	// Reset interaction flag when component mounts
	onMount(() => {
		// Check if onboarding should be shown
		if (browser && shouldShowOnboarding()) {
			goto('/onboarding');
			return;
		}

		userHasInteracted = false; // Reset on each navigation to home
		// Ensure showMenu matches setting on mount (in case store wasn't ready initially)
		const currentSetting = settingsStore.get('appearance.showHomescreenWhenOpened');
		if (!userHasInteracted) {
			showMenu = currentSetting === true;
		}
		// Disable initial load flag after a brief delay to allow transitions for future changes
		setTimeout(() => {
			isInitialLoad = false;
		}, 100);
	});
	
	// Get value from store reactively for updates
	$: showHomescreenWhenOpened = $settingsStore?.settings?.appearance?.showHomescreenWhenOpened ?? false;
	
	// Update showMenu when setting changes (but only if user hasn't interacted and not initial load)
	$: {
		if (!isInitialLoad && !isAnimating && !userHasInteracted) {
			showMenu = showHomescreenWhenOpened === true;
		}
	}
	
	// Swipe gesture tracking
	let touchStartX = 0;
	let touchStartY = 0;
	let touchEndX = 0;
	let touchEndY = 0;
	const minSwipeDistance = 50; // Minimum distance in pixels for a swipe
	const maxVerticalDistance = 100; // Maximum vertical movement to still count as horizontal swipe
	
	export let onBackClick = () => {
		if (isAnimating) return;
		isAnimating = true;
		userHasInteracted = true;
		showMenu = true;
		// Reset animation state after animation completes
		setTimeout(() => {
			isAnimating = false;
		}, 500);
	};
	
	function handleStartMenuBack() {
		if (isAnimating) return;
		isAnimating = true;
		userHasInteracted = true;
		showMenu = false;
		// Reset animation state after animation completes
		setTimeout(() => {
			isAnimating = false;
		}, 500);
	}
	
	function handleTouchStart(event) {
		if (isAnimating) return;
		const touch = event.touches[0];
		touchStartX = touch.clientX;
		touchStartY = touch.clientY;
	}
	
	function handleTouchMove(event) {
		// Prevent default scrolling during horizontal swipes
		const touch = event.touches[0];
		const deltaX = Math.abs(touch.clientX - touchStartX);
		const deltaY = Math.abs(touch.clientY - touchStartY);
		
		// If horizontal movement is greater than vertical, prevent default
		if (deltaX > deltaY && deltaX > 10) {
			event.preventDefault();
		}
	}
	
	function handleTouchEnd(event) {
		if (isAnimating) return;
		
		const touch = event.changedTouches[0];
		touchEndX = touch.clientX;
		touchEndY = touch.clientY;
		
		const deltaX = touchEndX - touchStartX;
		const deltaY = Math.abs(touchEndY - touchStartY);
		
		// Check if this is a horizontal swipe (not too vertical)
		if (deltaY > maxVerticalDistance) {
			return; // Too vertical, ignore
		}
		
		// Swipe right: from Apps to StartMenu
		if (deltaX > minSwipeDistance && !showMenu) {
			userHasInteracted = true;
			onBackClick();
		}
		// Swipe left: from StartMenu to Apps
		else if (deltaX < -minSwipeDistance && showMenu) {
			userHasInteracted = true;
			handleStartMenuBack();
		}
	}
</script>

<div 
	class="relative w-full h-screen overflow-hidden"
	on:touchstart={handleTouchStart}
	on:touchmove={handleTouchMove}
	on:touchend={handleTouchEnd}
>
	<!-- Apps Component -->
	<div 
		class="absolute inset-0 h-full"
		class:transition-transform={!isInitialLoad}
		class:duration-500={!isInitialLoad}
		class:ease-in-out={!isInitialLoad}
		class:slide-out-right={showMenu}
	>
		<Apps onBackClick={onBackClick} />
	</div>
	
	<!-- StartMenu Component -->
	<div 
		class="absolute inset-0"
		class:transition-transform={!isInitialLoad}
		class:duration-500={!isInitialLoad}
		class:ease-in-out={!isInitialLoad}
		class:slide-in-left={showMenu}
		class:slide-out-left={!showMenu}
	>
		<StartMenu onBackClick={handleStartMenuBack} />
	</div>
</div>

<style>
	.slide-out-right {
		transform: translateX(100%);
	}
	
	.slide-in-left {
		transform: translateX(0);
	}
	
	.slide-out-left {
		transform: translateX(-100%);
	}
</style>
