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
	class="w-full h-screen flex flex-col overflow-hidden overflow-y-auto scroll-smooth flex-1"
	bind:this={scrollContainer}
	on:click={handleContainerClick}
	on:keydown={handleKeyDown}
	role="button"
	aria-label="Click to exit edit mode"
	tabindex="0"
	style="scroll-behavior: smooth; -webkit-overflow-scrolling: touch;"
>
	<!-- Scrollable area for grid content -->
	<div>
		<!-- Grid container - only takes space it needs -->
		<div bind:this={gridContainer} class="w-full">
			<GridContainer {cols} {scrollContainer} />
		</div>
	</div>

	<!-- Back button positioned horizontally under the grid -->
	<div class="flex justify-end pr-4 pb-4 flex-shrink-0">
		<button
			class="flex flex-col border h-10 w-10 justify-center items-center border-white rounded-full !border-2 p-2 font-bold"
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
</style>
