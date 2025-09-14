<script>
	import { createEventDispatcher, onDestroy, onMount } from 'svelte';
	import Icon from '@iconify/svelte';
	import { gridStore } from '../store/grid.js';

	export let item;
	export let editMode = false;
	export let isSelected = false;
	export let isDragging = false;
	export let isDragOver = false;
	export let isRemoving = false;

	const dispatch = createEventDispatcher();

	let isPressed = false;
	let pressTimer = null;
	let dragStartPosition = null;
	let isDraggingTouch = false;
	let dragOffset = { x: 0, y: 0 };
	let currentPosition = { x: 0, y: 0 };
	let hasMoved = false;
	let dragThreshold = 10; // Minimum pixels to move before considering it a drag
	let draggingElement = null;
	let dragElementPosition = { x: 0, y: 0 };
	let wasSelected = false;
	let isDeselecting = false;
	let isSelecting = false;
	let previousEditMode = false;

	// Track selection state changes for smooth animations
	$: {
		// Handle selection animation
		if (editMode && isSelected && !wasSelected) {
			isSelecting = true;
			setTimeout(() => {
				isSelecting = false;
			}, 300);
		}
		
		// Handle deselection animation
		if (editMode && !isSelected && wasSelected) {
			isDeselecting = true;
			setTimeout(() => {
				isDeselecting = false;
			}, 300);
		}
		
		// Update previous states
		wasSelected = isSelected;
		previousEditMode = editMode;
	}

	// Handle mouse down for long press detection
	function handleMouseDown(event) {
		if (editMode) {
			// In edit mode, don't prevent default to allow drag to work
			return;
		}

		event.preventDefault();
		event.stopPropagation();
		isPressed = true;
		dragStartPosition = { x: event.clientX, y: event.clientY };

		// Start long press timer
		pressTimer = setTimeout(() => {
			if (isPressed) {
				dispatch('longPress', { itemId: item.id });
			}
		}, 500); // 500ms for long press
	}

	// Handle mouse up
	function handleMouseUp(event) {
		if (editMode) {
			// In edit mode, don't interfere with drag operations
			isPressed = false;
			if (pressTimer) {
				clearTimeout(pressTimer);
				pressTimer = null;
			}
			return;
		}

		event.preventDefault();
		event.stopPropagation();
		isPressed = false;
		if (pressTimer) {
			clearTimeout(pressTimer);
			pressTimer = null;
		}
	}

	// Handle mouse leave
	function handleMouseLeave(event) {
		if (editMode) {
			// In edit mode, don't interfere with drag operations
			isPressed = false;
			if (pressTimer) {
				clearTimeout(pressTimer);
				pressTimer = null;
			}
			return;
		}

		event.preventDefault();
		event.stopPropagation();
		isPressed = false;
		if (pressTimer) {
			clearTimeout(pressTimer);
			pressTimer = null;
		}
	}

	// Handle touch start for mobile
	function handleTouchStart(event) {
		// Check if touch is on a button - if so, don't handle long press
		const target = event.target.closest('button');
		if (target) {
			return;
		}

		const touch = event.touches[0];
		dragStartPosition = { x: touch.clientX, y: touch.clientY };
		currentPosition = { x: touch.clientX, y: touch.clientY };
		hasMoved = false;

		if (editMode) {
			// In edit mode, don't start drag immediately - wait for movement
			event.preventDefault();
			event.stopPropagation();
			isPressed = true;
			return;
		}

		event.preventDefault();
		event.stopPropagation();
		isPressed = true;

		// Start long press timer
		pressTimer = setTimeout(() => {
			if (isPressed) {
				dispatch('longPress', { itemId: item.id });
			}
		}, 500); // 500ms for long press
	}

	// Handle touch move
	function handleTouchMove(event) {
		if (!editMode || !isPressed) return;

		const touch = event.touches[0];
		currentPosition = { x: touch.clientX, y: touch.clientY };
		
		// Calculate distance moved from start position
		const deltaX = currentPosition.x - dragStartPosition.x;
		const deltaY = currentPosition.y - dragStartPosition.y;
		const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
		
		// If moved enough, start dragging
		if (distance > dragThreshold && !isDraggingTouch) {
			hasMoved = true;
			isDraggingTouch = true;
			
			// Create dragging element
			createDraggingElement();
			
			// Dispatch drag start to show visual feedback
			dispatch('dragStart', { item });
		}
		
		if (isDraggingTouch) {
			event.preventDefault();
			event.stopPropagation();
			
			// Update dragging element position
			updateDraggingElementPosition(currentPosition);
			
			// Dispatch drag over event for visual feedback
			dispatch('dragOver', { item, event, touchPosition: currentPosition });
		}
	}

	// Handle touch end
	function handleTouchEnd(event) {
		// Check if touch is on a button - if so, don't handle touch end
		const target = event.target.closest('button');
		if (target) {
			return;
		}

		if (isDraggingTouch && editMode) {
			event.preventDefault();
			event.stopPropagation();
			cleanup();
			dispatch('dragEnd', { item });
			hasMoved = false;
			return;
		}

		if (editMode && isPressed && !hasMoved) {
			// This was a tap in edit mode - select the item
			event.preventDefault();
			event.stopPropagation();
			dispatch('click', { itemId: item.id });
			isPressed = false;
			return;
		}

		if (editMode) {
			// In edit mode, clean up state
			isPressed = false;
			hasMoved = false;
			if (pressTimer) {
				clearTimeout(pressTimer);
				pressTimer = null;
			}
			return;
		}

		event.preventDefault();
		event.stopPropagation();
		isPressed = false;
		if (pressTimer) {
			clearTimeout(pressTimer);
			pressTimer = null;
		}
	}

	// Handle click
	function handleClick(event) {
		// Check if click is on an edit control button - if so, don't handle selection
		const target = event.target.closest('button');
		if (target && editMode) {
			// Don't change selection when clicking edit controls
			return;
		}

		if (editMode) {
			// In edit mode, clicking on the item selects it
			event.preventDefault();
			event.stopPropagation();
			dispatch('click', { itemId: item.id });
			return;
		}

		event.preventDefault();
		event.stopPropagation();

		// If it was a long press, don't trigger click
		if (pressTimer) {
			clearTimeout(pressTimer);
			pressTimer = null;
			return;
		}

		// Only trigger click if it wasn't a long press
		if (!isPressed) {
			window.location.href = item.src;
		}
	}

	// Handle keyboard events
	function handleKeyDown(event) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			handleClick(event);
		}
	}

	// Handle resize button click
	function handleResize() {
		// Only allow resize if this item is selected
		if (isSelected) {
			gridStore.updateItemSize(item.id);
		}
	}

	// Handle remove button click
	function handleRemove() {
		// Dispatch remove event to parent
		dispatch('remove', { itemId: item.id });
	}


	// Handle drag start
	function handleDragStart(event) {
		if (!editMode) return;

		event.dataTransfer.setData('text/plain', item.id);
		event.dataTransfer.effectAllowed = 'move';

		dispatch('dragStart', { item });
	}

	// Create dragging element
	function createDraggingElement() {
		if (draggingElement) return;
		
		// Create a simple dragging indicator
		draggingElement = document.createElement('div');
		draggingElement.className = `grid-item-drag absolute pointer-events-none z-50 ${item.bgColor} text-white rounded-lg`;
		draggingElement.style.width = '80px';
		draggingElement.style.height = '80px';
		draggingElement.style.transform = 'scale(0.9)';
		draggingElement.style.opacity = '0.8';
		draggingElement.style.border = '3px solid rgba(255, 255, 255, 0.8)';
		draggingElement.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.4)';
		draggingElement.style.display = 'flex';
		draggingElement.style.alignItems = 'center';
		draggingElement.style.justifyContent = 'center';
		draggingElement.style.fontSize = '32px';
		draggingElement.innerHTML = '📱'; // Simple emoji indicator
		
		document.body.appendChild(draggingElement);
		
		// Set initial position
		dragElementPosition = { x: currentPosition.x - 40, y: currentPosition.y - 40 };
		draggingElement.style.left = `${dragElementPosition.x}px`;
		draggingElement.style.top = `${dragElementPosition.y}px`;
	}

	// Update dragging element position
	function updateDraggingElementPosition(position) {
		if (!draggingElement) return;
		
		dragElementPosition = { x: position.x - 40, y: position.y - 40 };
		draggingElement.style.left = `${dragElementPosition.x}px`;
		draggingElement.style.top = `${dragElementPosition.y}px`;
	}

	// Remove dragging element
	function removeDraggingElement() {
		if (draggingElement) {
			document.body.removeChild(draggingElement);
			draggingElement = null;
		}
	}


	// Handle drag end
	function handleDragEnd() {
		isDraggingTouch = false;
		removeDraggingElement();
		dispatch('dragEnd', { item });
	}

	// Cleanup function to ensure dragging element is removed
	function cleanup() {
		removeDraggingElement();
		isDraggingTouch = false;
		isPressed = false;
		if (pressTimer) {
			clearTimeout(pressTimer);
			pressTimer = null;
		}
	}

	// Ensure cleanup on component destroy
	onDestroy(() => {
		cleanup();
	});

	// Handle drag over
	function handleDragOver(event) {
		if (!editMode) return;

		event.preventDefault();
		event.dataTransfer.dropEffect = 'move';

		dispatch('dragOver', { item, event });
	}

	// Handle drop
	function handleDrop(event) {
		if (!editMode) return;

		event.preventDefault();
		const draggedItemId = event.dataTransfer.getData('text/plain');

		if (draggedItemId && draggedItemId !== item.id) {
			dispatch('drop', { targetItem: item, draggedItemId });
		}
	}

	// Get size display text
	function getSizeText(size) {
		const sizeMap = {
			'1x1': '1×1',
			'2x2': '2×2',
			'4x2': '4×2'
		};
		return sizeMap[size] || size;
	}

	// Get item dimensions for CSS
	function getItemDimensions() {
		const sizeMap = {
			'1x1': { width: '1fr', height: '1fr' },
			'2x2': { width: '2fr', height: '2fr' },
			'4x2': { width: '4fr', height: '2fr' }
		};
		return sizeMap[item.size] || sizeMap['1x1'];
	}
</script>

<div
	class="grid-item relative group {item.bgColor} text-white cursor-pointer {editMode && isSelected ? 'selected' : ''} {isRemoving
		? 'animate-removal'
		: isDragging
		? 'opacity-50 scale-95'
		: editMode && isSelected && !isDragging && isSelecting
		? 'animate-selected'
		: editMode && isSelected && !isDragging && !isSelecting
		? 'selected-state'
		: editMode && !isSelected && !isDragging && isDeselecting
		? 'animate-deselected'
		: editMode && !isSelected && !isDragging && !isDeselecting
		? 'animate-float-edit'
		: !editMode && !isDragging
		? 'opacity-100'
		: ''} {isDragOver ? 'ring-2 ring-white ring-opacity-50' : ''} {editMode ? 'edit-mode' : 'normal-mode'} size-{item.size}"
	data-item-id={item.id}
	style="align-self: flex-start; transform-origin: center; {editMode && !isSelected
		? `animation-delay: ${0.5 + (item.id.charCodeAt(0) % 4) * 0.2}s;`
		: ''}"
	on:mousedown={handleMouseDown}
	on:mouseup={handleMouseUp}
	on:mouseleave={handleMouseLeave}
	on:touchstart={handleTouchStart}
	on:touchmove={handleTouchMove}
	on:touchend={handleTouchEnd}
	on:click={handleClick}
	on:keydown={handleKeyDown}
	on:dragstart={handleDragStart}
	on:dragend={handleDragEnd}
	on:dragover={handleDragOver}
	on:drop={handleDrop}
	draggable={editMode}
	role="button"
	tabindex="0"
>
	<!-- Main content -->
	<div class="relative flex flex-col items-center justify-center h-full p-2">
		<div class="flex flex-col items-center justify-center h-full w-full">
			<Icon icon={item.icon} width="48" height="48" />
			{#if item.size !== '1x1'}
				<span class="absolute bottom-2 left-2 text-sm mt-2 text-center font-medium"
					>{item.name}</span
				>
			{/if}
		</div>
	</div>

	<!-- Edit mode controls - only show for selected item -->
	{#if editMode}
		<!-- Remove button (top right) - only for selected item -->
		{#if isSelected}
			<button
				class="absolute -top-2 -right-2 w-8 h-8 bg-black border-2 border-white rounded-full flex items-center justify-center text-white text-xs font-bold transition-all duration-300 ease-in-out opacity-100 scale-100 z-20"
				on:click={handleRemove}
			>
				<Icon icon="ri:unpin-fill" width="18" height="18" />
			</button>
		{:else}
			<button
				class="absolute top-1 right-1 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white text-xs font-bold transition-all duration-300 ease-in-out opacity-0 hover:opacity-100 scale-75 hover:scale-100 pointer-events-none group-hover:pointer-events-auto"
				on:click|stopPropagation={handleResize}
			>
				<Icon icon="mdi:close" width="12" height="12" />
			</button>
		{/if}

		<!-- Resize button (bottom right) - only for selected item -->
		{#if isSelected}
			<button
				class="absolute -bottom-2 -right-2 w-8 h-8 bg-black border-2 border-white rounded-full flex items-center justify-center text-white text-xs font-bold transition-all duration-300 ease-in-out opacity-100 scale-100 z-20"
				on:click={handleResize}
			>
				<Icon
					icon="subway:left-arrow"
					width="18"
					height="18"
					style="transform: {item.size === '1x1' || item.size === '2x2'
						? 'rotate(225deg)'
						: 'rotate(0deg)'}"
				/>
			</button>
		{:else}
			<button
				class="absolute bottom-1 right-1 w-6 h-6 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold transition-all duration-300 ease-in-out opacity-0 hover:opacity-100 scale-75 hover:scale-100 pointer-events-none group-hover:pointer-events-auto"
				on:click|stopPropagation={handleResize}
			>
				<span class="text-xs">{getSizeText(item.size)}</span>
			</button>
		{/if}
	{/if}

	<!-- Drag indicator (when dragging) -->
	{#if isDragging}
		<div
			class="absolute inset-0 border-2 border-dashed border-white border-opacity-50 rounded-lg flex items-center justify-center"
		>
			<Icon icon="mdi:drag" width="24" height="24" class="text-white opacity-50" />
		</div>
	{/if}
</div>

<style>
	.grid-item {
		min-height: 60px;
		min-width: 60px;
		transition: transform 300ms ease-in-out, opacity 300ms ease-in-out, width 300ms ease-in-out, aspect-ratio 300ms ease-in-out;
	}

	/* Size classes for different tile sizes */
	.size-1x1 {
		width: calc(25% - 6px);
		aspect-ratio: 1;
	}

	.size-2x2 {
		width: calc(50% - 8px);
		aspect-ratio: 1;
	}

	.size-4x2 {
		width: calc(100% - 8px);
		aspect-ratio: 2;
	}

	/* Edit mode size adjustments */
	.edit-mode.size-1x1 {
		width: calc(23% - 12px);
	}

	.edit-mode.size-2x2 {
		width: calc(48% - 12px);
	}

	.edit-mode.size-4x2 {
		width: calc(96% - 12px);
	}

	.grid-item:hover {
		transform: scale(1.02);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
	}

	.grid-item:active {
		transform: scale(0.98);
	}

	/* Original float animation for non-edit mode */
	@keyframes float {
		0%,
		100% {
			transform: translateY(0px) translateX(0px);
		}
		25% {
			transform: translateY(-10px) translateX(6px);
		}
		50% {
			transform: translateY(-4px) translateX(-8px);
		}
		75% {
			transform: translateY(-7px) translateX(4px);
		}
	}

	.animate-float {
		animation: float 8s ease-in-out infinite;
	}

	/* Edit mode float animation - for non-selected items */
	@keyframes float-edit {
		0%,
		100% {
			transform: translateY(0px) translateX(0px) scale(0.9);
		}
		25% {
			transform: translateY(-8px) translateX(5px) scale(0.9);
		}
		50% {
			transform: translateY(-3px) translateX(-6px) scale(0.9);
		}
		75% {
			transform: translateY(-6px) translateX(3px) scale(0.9);
		}
	}

	.animate-float-edit {
		animation: float-edit 6s ease-in-out infinite;
		opacity: 0.6;
	}

	/* Selected item animation - smooth scale and opacity */
	@keyframes selected {
		from {
			transform: scale(0.9);
			opacity: 0.6;
		}
		to {
			transform: scale(1.05);
			opacity: 1;
		}
	}

	/* Deselected item animation - smooth transition back to float state */
	@keyframes deselected {
		from {
			transform: scale(1.05);
			opacity: 1;
		}
		to {
			transform: scale(0.9);
			opacity: 0.6;
		}
	}

	.animate-selected {
		animation: selected 300ms ease-out forwards !important;
		transition: none !important;
	}

	.animate-deselected {
		animation: deselected 300ms ease-out forwards !important;
		transition: none !important;
	}

	/* Selected state - final state after animation */
	.selected-state {
		opacity: 1 !important;
		transform: scale(1.05) !important;
		animation: none !important;
	}

	/* Removal animation - scale to 0 */
	@keyframes removal {
		0% {
			transform: scale(1);
			opacity: 1;
		}
		100% {
			transform: scale(0);
			opacity: 0;
		}
	}

	.animate-removal {
		animation: removal 300ms ease-in forwards !important;
		pointer-events: none !important;
	}

	/* Ensure selected items don't have float animation */
	.grid-item.selected {
		animation: none !important;
	}

	/* Ensure dragging items don't have other animations */
	.grid-item.opacity-50.scale-95 {
		animation: none !important;
	}

	/* Ensure deselection animation doesn't interfere with other states */
	.animate-deselected {
		animation: deselected 300ms ease-out forwards !important;
	}

	/* Ensure deselection animation has proper priority */
	.grid-item.animate-deselected {
		animation: deselected 300ms ease-out forwards !important;
		transition: none !important;
	}

	/* Ensure removal animation has highest priority */
	.grid-item.animate-removal {
		animation: removal 300ms ease-in forwards !important;
		pointer-events: none !important;
		opacity: 1 !important;
		transform: scale(1) !important;
	}

	/* Additional specificity for removal animation */
	div.animate-removal {
		animation: removal 300ms ease-in forwards !important;
		pointer-events: none !important;
	}

	/* Ensure selection animation has proper priority */
	.grid-item.animate-selected {
		animation: selected 300ms ease-out forwards !important;
		transition: none !important;
	}

	/* Ensure float animation works properly */
	.grid-item.animate-float-edit {
		animation: float-edit 6s ease-in-out infinite !important;
		opacity: 0.6 !important;
	}

	/* Vary animation timing for different items */
	.animate-float-edit:nth-child(odd) {
		animation-duration: 5.5s;
	}

	.animate-float-edit:nth-child(even) {
		animation-duration: 6.5s;
	}

	.animate-float:nth-child(odd) {
		animation-duration: 7.5s;
	}

	.animate-float:nth-child(even) {
		animation-duration: 8.5s;
	}
</style>
