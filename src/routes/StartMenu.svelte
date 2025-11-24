<script>
	import Icon from '@iconify/svelte';
	import { settingsStore } from '../store/settings.js';
	import { gridStore } from '../store/grid.js';
	import GridContainer from '../components/GridContainer.svelte';
	import { backgroundClassStore, accentColorStore, backgroundThemeStore, borderColorClassStore } from '../utils/theme';

	export let onBackClick = () => {};

	let gridContainer;
	let scrollContainer;
	let cols = 4; // Fixed to 4 columns
	
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
			<GridContainer {cols} {scrollContainer} />
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

	/* Grid container - theme-aware background */
	:global(.grid-container .grid) {
		background: var(--bg-color, #000000);
	}

	/* Windows Phone 8.1 tiles - solid colored backgrounds */
	:global(.grid-container .grid .grid-item) {
		background: var(--tile-bg-color, #0078d4) !important;
		background-color: var(--tile-bg-color, #0078d4) !important;
		background-image: none !important;
		border: none !important;
		transition: all 0.2s ease-in-out;
	}

	/* Apply solid colors based on bgColor class */
	:global(.grid-container .grid .grid-item.bg-blue-500) {
		background: #0078d4 !important;
		background-color: #0078d4 !important;
	}

	:global(.grid-container .grid .grid-item.bg-green-500) {
		background: #107c10 !important;
		background-color: #107c10 !important;
	}

	:global(.grid-container .grid .grid-item.bg-purple-500) {
		background: #5c2d91 !important;
		background-color: #5c2d91 !important;
	}

	:global(.grid-container .grid .grid-item.bg-orange-500) {
		background: #ff8c00 !important;
		background-color: #ff8c00 !important;
	}

	:global(.grid-container .grid .grid-item.bg-red-500) {
		background: #e81123 !important;
		background-color: #e81123 !important;
	}

	:global(.grid-container .grid .grid-item.bg-yellow-500) {
		background: #ffb900 !important;
		background-color: #ffb900 !important;
	}

	:global(.grid-container .grid .grid-item.bg-pink-500) {
		background: #e3008c !important;
		background-color: #e3008c !important;
	}

	:global(.grid-container .grid .grid-item.bg-indigo-500) {
		background: #6b69d6 !important;
		background-color: #6b69d6 !important;
	}

	:global(.grid-container .grid .grid-item.bg-cyan-500) {
		background: #00bcf2 !important;
		background-color: #00bcf2 !important;
	}

	/* Default homescreen background color */
	:global(.grid-container .grid .grid-item.bg-\[#ff00ff\]) {
		background: var(--accent-color) !important;
		background-color: var(--accent-color) !important;
	}

	/* Hover effects for tiles - subtle darkening */
	:global(.grid-item:hover) {
		opacity: 0.9;
		transform: scale(1.01);
	}

	/* Active/pressed state */
	:global(.grid-item:active) {
		opacity: 0.8;
		transform: scale(0.98);
	}
</style>
