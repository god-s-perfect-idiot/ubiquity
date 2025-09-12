<script>
	import Apps from './Apps.svelte';
	import StartMenu from './StartMenu.svelte';
    
	let showMenu = false;
	let isAnimating = false;
	
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
</script>

<div class="relative w-full h-screen overflow-hidden">
	<!-- Apps Component -->
	<div 
		class="absolute inset-0 transition-transform duration-500 ease-in-out"
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
