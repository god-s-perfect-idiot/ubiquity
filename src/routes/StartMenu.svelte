<script>
	import Icon from '@iconify/svelte';
	import { settingsStore } from '../store/settings.js';
	import { gridStore } from '../store/grid.js';
	import GridContainer from '../components/GridContainer.svelte';
	import { backgroundClassStore, accentColorStore, backgroundThemeStore, borderColorClassStore } from '../utils/theme';

	export let onBackClick = () => {};

	let gridContainer;
	let scrollContainer;

	$: showMoreCols = $settingsStore.settings.appearance?.showMoreCols || false;
	$: desktopStartMenu = $settingsStore.settings.appearance?.desktopStartMenu || false;
	$: cols = desktopStartMenu ? 10 : showMoreCols ? 6 : 4;
	$: minRows = desktopStartMenu || showMoreCols ? 6 : 4;
	
	// Get theme-aware background reactively
	$: bgClass = $backgroundClassStore;
	$: accentColor = $accentColorStore;
	$: bgColorValue = $backgroundThemeStore === 'light' ? '#ffffff' : '#000000';
	$: borderClass = $borderColorClassStore;
	
	// Reactive statement to track edit mode
	$: isInEditMode = $gridStore.editMode;

	// Handle click to exit edit mode
	function handleContainerClick(event) {
		// Check if we're in edit mode and clicked outside grid items
		const target = event.target.closest('.grid-item, button');
		if (!target && $gridStore.editMode) {
			gridStore.setEditMode(false);
		}
	}

	// Handle keyboard events for accessibility
	function handleKeyDown(event) {
		if (event.key === 'Escape' && $gridStore.editMode) {
			gridStore.setEditMode(false);
		}
	}
</script>

<div
	class="w-full h-screen flex flex-col overflow-hidden overflow-y-auto scroll-smooth flex-1 relative {bgClass}"
	style="--accent-color: {accentColor}; --bg-color: {bgColorValue}; scroll-behavior: smooth; -webkit-overflow-scrolling: touch;"
	bind:this={scrollContainer}
	on:click={handleContainerClick}
	on:keydown={handleKeyDown}
	role="button"
	aria-label="Click to exit edit mode"
	tabindex="0"
>
	
	<!-- Scrollable area for grid content -->
	<div class="relative z-10">
		<!-- Grid container -->
		<div bind:this={gridContainer} class="w-full">
			<GridContainer {cols} {minRows} {scrollContainer} />
		</div>
	</div>

	<!-- Back button positioned horizontally under the grid -->
	<div class="flex justify-end pr-4 pb-4 flex-shrink-0 z-20">
		<button
			class="flex flex-col border h-10 w-10 justify-center items-center {borderClass} rounded-full !border-2 p-2 font-bold {bgClass} hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:{bgClass}"
			on:click={() => {
				if (!isInEditMode) {
					onBackClick();
				}
			}}
			disabled={isInEditMode}
			aria-label={isInEditMode ? "Back button disabled in edit mode" : "Go back"}
		>
			<Icon icon="subway:right-arrow" width="18" height="18" strokeWidth="2" />
		</button>
	</div>
</div>

<style>
	/* Enhanced scrolling styles for StartMenu */
	.scroll-smooth {
		scroll-behavior: smooth;
		-webkit-overflow-scrolling: touch;
	}

	/* Windows Phone 8.1 style - theme-aware background */
	:global(.grid-container) {
		background: var(--bg-color, #000000);
	}

	:global(.grid-container .wp-grid) {
		background: var(--bg-color, #000000);
	}
</style>
