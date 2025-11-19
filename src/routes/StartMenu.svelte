<script>
	import Icon from '@iconify/svelte';
	import { settingsStore } from '../store/settings.js';
	import { gridStore } from '../store/grid.js';
	import GridContainer from '../components/GridContainer.svelte';

	export let onBackClick = () => {};

	let gridContainer;
	let scrollContainer;
	let cols = 4; // Fixed to 4 columns

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
	class="w-full h-screen flex flex-col overflow-hidden overflow-y-auto scroll-smooth flex-1 relative"
	bind:this={scrollContainer}
	on:click={handleContainerClick}
	on:keydown={handleKeyDown}
	role="button"
	aria-label="Click to exit edit mode"
	tabindex="0"
	style="scroll-behavior: smooth; -webkit-overflow-scrolling: touch;"
>
	
	<!-- Scrollable area for grid content -->
	<div class="relative z-10">
		<!-- Grid container with black margins -->
		<div bind:this={gridContainer} class="w-full" >
			<GridContainer {cols} {scrollContainer} />
		</div>
	</div>

	<!-- Back button positioned horizontally under the grid -->
	<div class="flex justify-end pr-4 pb-4 flex-shrink-0 z-20">
		<button
			class="flex flex-col border h-10 w-10 justify-center items-center border-white rounded-full !border-2 p-2 font-bold bg-black bg-opacity-50 backdrop-blur-sm"
			on:click={onBackClick}
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

	/* Make grid container transparent so background shows through */
	:global(.grid-container) {
		background: transparent;
	}

	/* Grid container - transparent */
	:global(.grid-container .grid) {
		background: transparent;
	}

	/* Force all grid items to be completely transparent - maximum specificity */
	:global(.grid-container .grid .grid-item),
	:global(.grid-container .grid .grid-item.bg-blue-500),
	:global(.grid-container .grid .grid-item.bg-green-500),
	:global(.grid-container .grid .grid-item.bg-purple-500),
	:global(.grid-container .grid .grid-item.bg-orange-500),
	:global(.grid-container .grid .grid-item.bg-red-500),
	:global(.grid-container .grid .grid-item.bg-yellow-500),
	:global(.grid-container .grid .grid-item.bg-pink-500),
	:global(.grid-container .grid .grid-item.bg-indigo-500),
	:global(.grid-container .grid .grid-item.bg-cyan-500),
	:global(.grid-container .grid .grid-item.group),
	:global(.grid-container .grid .grid-item.relative),
	:global(.grid-container .grid .grid-item.text-white),
	:global(.grid-container .grid .grid-item.cursor-pointer) {
		background: transparent !important;
		background-color: transparent !important;
		background-image: none !important;
		backdrop-filter: blur(1px);
		border: 1px solid rgba(255, 255, 255, 0.3);
		transition: all 0.2s ease-in-out;
	}

	/* Override any possible Tailwind background classes */
	:global(.grid-item[class*="bg-"]) {
		background: transparent !important;
		background-color: transparent !important;
	}

	/* Nuclear option - override everything */
	:global(div.grid-item) {
		background: transparent !important;
		background-color: transparent !important;
		background-image: none !important;
	}

	/* Override any inherited styles */
	:global(.grid-item *),
	:global(.grid-item::before),
	:global(.grid-item::after) {
		background: transparent !important;
		background-color: transparent !important;
	}

	/* Hover effects for tiles - subtle overlay */
	:global(.grid-item:hover) {
		background: rgba(0, 0, 0, 0.1) !important;
		backdrop-filter: blur(2px);
		transform: scale(1.02);
		border-color: rgba(255, 255, 255, 0.5);
	}
</style>
