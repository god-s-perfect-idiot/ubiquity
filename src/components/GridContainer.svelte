<script>
	import { onMount, onDestroy } from 'svelte';
	import { gridStore } from '../store/grid.js';
	import GridItem from './GridItem.svelte';
	import Icon from '@iconify/svelte';

	export let cols = 4;
	export let rows = 6;

	// No need to calculate rows with flexbox

	let gridContainer;
	let draggedItem = null;
	let dragOverPosition = null;
	let editMode = false;

	// Subscribe to grid store
	$: gridState = $gridStore;
	$: editMode = gridState.editMode;
	$: selectedItemId = gridState.selectedItemId;
	$: items = gridState.items;
	
	

	// Initialize grid size
	onMount(() => {
		gridStore.setGridSize(cols, rows);
		// Initialize with default items if empty
		if (items.length === 0) {
			gridStore.initializeDefaultItems();
		}
	});

	// Handle long press to enter edit mode
	function handleLongPress(event) {
		const itemId = event.detail.itemId;
		gridStore.setSelectedItem(itemId);
		gridStore.setEditMode(true);
	}

	// Handle item click (select item in edit mode or exit edit mode)
	function handleItemClick(event) {
		if (editMode) {
			// If clicking on an item, select it
			const itemId = event.detail.itemId;
			if (itemId) {
				gridStore.setSelectedItem(itemId);
			} else {
				// If clicking outside items, exit edit mode
				gridStore.setEditMode(false);
			}
		}
	}

	// Handle grid background click (exit edit mode)
	function handleGridClick(event) {
		if (editMode) {
			// Check if click was on a grid item or button
			const target = event.target.closest('.grid-item, button');
			if (!target) {
				gridStore.setEditMode(false);
			}
		}
	}

	// Handle drag start
	function handleDragStart(event) {
		draggedItem = event.detail.item;
		gridStore.setDraggedItem(draggedItem.id);
	}

	// Handle drag end
	function handleDragEnd(event) {
		gridStore.clearDragState();
		draggedItem = null;
		dragOverPosition = null;
	}

	// Handle drag over - simplified for flexbox
	function handleDragOver(event) {
		if (!editMode || !draggedItem) return;
		// With flexbox, we don't need complex position calculations
	}

	// Handle drop - simplified for flexbox
	function handleDrop(event) {
		if (!editMode || !draggedItem) return;
		// With flexbox, items automatically reorder
	}


	// No need for position-based functions with flexbox
</script>

<div class="grid-container w-full relative flex-1" bind:this={gridContainer}>
	<!-- Grid background -->
	<div 
		class="flex flex-wrap w-full items-start transition-all duration-300 ease-in-out"
		class:gap-2={!editMode}
		class:gap-6={editMode}
		class:p-4={!editMode}
		class:px-6={editMode}
		class:py-4={editMode}
		on:click={handleGridClick}
		on:dragover={handleDragOver}
		role="grid"
		tabindex="0"
		on:keydown={(e) => e.preventDefault()}
	>
		<!-- Grid items -->
		{#each items as item (item.id)}
			<GridItem
				{item}
				{editMode}
				isSelected={selectedItemId === item.id}
				isDragging={draggedItem?.id === item.id}
				isDragOver={false}
				on:longPress={handleLongPress}
				on:click={handleItemClick}
				on:dragStart={handleDragStart}
				on:dragEnd={handleDragEnd}
				on:dragOver={handleDragOver}
				on:drop={handleDrop}
			/>
		{/each}
	</div>


</div>

<style>
	.grid-container {
		overflow: hidden;
	}

</style>
