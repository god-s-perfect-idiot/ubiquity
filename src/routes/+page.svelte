<script>
	import Apps from './Apps.svelte';
	import StartMenu from './StartMenu.svelte';
    
	let showMenu = false;
	let isAnimating = false;
	
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
		showMenu = true;
		// Reset animation state after animation completes
		setTimeout(() => {
			isAnimating = false;
		}, 500);
	};
	
	function handleStartMenuBack() {
		if (isAnimating) return;
		isAnimating = true;
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
			onBackClick();
		}
		// Swipe left: from StartMenu to Apps
		else if (deltaX < -minSwipeDistance && showMenu) {
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
		class="absolute inset-0 transition-transform duration-500 ease-in-out h-full"
		class:slide-out-right={showMenu}
	>
		<Apps onBackClick={onBackClick} />
	</div>
	
	<!-- StartMenu Component -->
	<div 
		class="absolute inset-0 transition-transform duration-500 ease-in-out"
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
