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
	let animationPattern = 0;
	let animationDelay = 0;
	let animationDuration = 6;

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

	// Debug: Log when editMode changes
	$: console.log(`Item ${item.id}: editMode = ${editMode}`);

	// Also subscribe directly to grid store for edit mode
	$: storeEditMode = $gridStore.editMode;
	$: console.log(`Item ${item.id}: storeEditMode = ${storeEditMode}`);

	// Reactive icon size based on edit mode
	$: iconSize = editMode ? 36 : 48;
	$: console.log('EditMode changed:', editMode, 'IconSize:', iconSize);

	// Function to get icon size
	function getIconSize() {
		return editMode ? 36 : 48;
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
		isPressed = true;

		// Start long press timer
		pressTimer = setTimeout(() => {
			if (isPressed && !hasMoved) {
				// Only prevent default when we're actually doing a long press
				event.preventDefault();
				dispatch('longPress', { itemId: item.id });
			}
		}, 500); // 500ms for long press
	}

	// Handle touch move
	function handleTouchMove(event) {
		if (!isPressed) return;

		const touch = event.touches[0];
		currentPosition = { x: touch.clientX, y: touch.clientY };

		// Calculate distance moved from start position
		const deltaX = currentPosition.x - dragStartPosition.x;
		const deltaY = currentPosition.y - dragStartPosition.y;
		const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

		// Only handle dragging in edit mode
		if (editMode) {
			// In edit mode, prevent scrolling for any movement to avoid conflicts
			event.preventDefault();
			event.stopPropagation();

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
				// Update dragging element position
				updateDraggingElementPosition(currentPosition);

				// Dispatch drag over event for visual feedback
				dispatch('dragOver', { item, event, touchPosition: currentPosition });

				// Also dispatch a custom event for auto-scroll
				dispatch('autoScrollCheck', { touchPosition: currentPosition });
			}
		} else {
			// In non-edit mode, just track if we've moved enough to cancel long press
			if (distance > dragThreshold) {
				hasMoved = true;
			}
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

		// Clean up state without preventing default for scrolling
		isPressed = false;
		hasMoved = false;
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
			console.log(`Resizing item ${item.id} from ${item.size} to next size`);
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

		// Get the actual item dimensions
		const itemElement = document.querySelector(`[data-item-id="${item.id}"]`);
		const rect = itemElement ? itemElement.getBoundingClientRect() : { width: 80, height: 80 };

		// Create dragging element that matches the actual item
		draggingElement = document.createElement('div');
		draggingElement.className = `grid-item-drag absolute pointer-events-none z-50 ${item.bgColor} text-white`;
		draggingElement.style.width = `${rect.width}px`;
		draggingElement.style.height = `${rect.height}px`;
		draggingElement.style.transform = 'scale(0.9)';
		draggingElement.style.opacity = '0.8';
		// draggingElement.style.border = '3px solid rgba(255, 255, 255, 0.8)';
		draggingElement.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.4)';
		draggingElement.style.display = 'flex';
		draggingElement.style.alignItems = 'center';
		draggingElement.style.justifyContent = 'center';
		draggingElement.style.flexDirection = 'column';
		draggingElement.style.padding = '8px';
		draggingElement.style.boxSizing = 'border-box';

		// Create the icon element
		const iconElement = document.createElement('div');
		iconElement.innerHTML = `<svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
			<path d="${getIconPath(item.icon)}"/>
		</svg>`;
		draggingElement.appendChild(iconElement);

		// Add item name if it's not 1x1
		if (item.size !== '1x1') {
			const nameElement = document.createElement('div');
			nameElement.textContent = item.name;
			nameElement.style.fontSize = '12px';
			nameElement.style.fontWeight = '500';
			nameElement.style.marginTop = '4px';
			nameElement.style.textAlign = 'center';
			draggingElement.appendChild(nameElement);
		}

		document.body.appendChild(draggingElement);

		// Set initial position (centered on cursor)
		const centerX = rect.width / 2;
		const centerY = rect.height / 2;
		dragElementPosition = { x: currentPosition.x - centerX, y: currentPosition.y - centerY };
		draggingElement.style.left = `${dragElementPosition.x}px`;
		draggingElement.style.top = `${dragElementPosition.y}px`;
	}

	// Update dragging element position
	function updateDraggingElementPosition(position) {
		if (!draggingElement) return;

		// Get the current dimensions of the dragging element
		const rect = draggingElement.getBoundingClientRect();
		const centerX = rect.width / 2;
		const centerY = rect.height / 2;

		dragElementPosition = { x: position.x - centerX, y: position.y - centerY };
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

	// Initialize random animation properties
	onMount(() => {
		// Generate random animation pattern (0-3)
		animationPattern = Math.floor(Math.random() * 4);
		// Generate random delay (0-0.3 seconds) - shorter delay for immediate start
		animationDelay = Math.random() * 0.3;
		// Generate random duration (4-8 seconds)
		animationDuration = 8 + Math.random() * 4;
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

	// Get item dimensions for CSS Grid - make it reactive
	$: itemDimensions = (() => {
		const sizeMap = {
			'1x1': { gridColumn: 'span 1', gridRow: 'span 1' },
			'2x2': { gridColumn: 'span 2', gridRow: 'span 2' },
			'4x2': { gridColumn: 'span 4', gridRow: 'span 2' }
		};
		const dimensions = sizeMap[item.size] || sizeMap['1x1'];
		console.log(`Item ${item.id} dimensions updated: ${item.size} -> ${dimensions.gridColumn} x ${dimensions.gridRow}`);
		return dimensions;
	})();

	// Get icon path for SVG (simplified version for common icons)
	function getIconPath(iconName) {
		// This is a simplified mapping - in a real app you'd use a proper icon library
		const iconMap = {
			'mdi:settings':
				'M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.22,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.22,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.68 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z',
			'mdi:home': 'M10,20V14H14V20H19V12H22L12,3L2,12H5V20H10Z',
			'mdi:email':
				'M20,4H4C2.89,4 2,4.89 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V6C22,4.89 21.1,4 20,4M20,8L12,13L4,8V6L12,11L20,6V8Z',
			'mdi:phone':
				'M6.62,10.79C8.06,13.62 10.38,15.94 13.21,17.38L15.41,15.18C15.69,14.9 16.08,14.82 16.43,14.93C17.55,15.3 18.75,15.5 20,15.5A1,1 0 0,1 21,16.5V20A1,1 0 0,1 20,21A17,17 0 0,1 3,4A1,1 0 0,1 4,3H7.5A1,1 0 0,1 8.5,4C8.5,5.25 8.7,6.45 9.07,7.57C9.18,7.92 9.1,8.31 8.82,8.59L6.62,10.79Z',
			'mdi:camera':
				'M4,4H7L9,2H15L17,4H20A2,2 0 0,1 22,6V18A2,2 0 0,1 20,20H4A2,2 0 0,1 2,18V6A2,2 0 0,1 4,4M12,7A5,5 0 0,0 7,12A5,5 0 0,0 12,17A5,5 0 0,0 17,12A5,5 0 0,0 12,7M12,9A3,3 0 0,1 15,12A3,3 0 0,1 12,15A3,3 0 0,1 9,12A3,3 0 0,1 12,9Z',
			'mdi:music':
				'M12,3V13.55C11.41,13.21 10.73,13 10,13A4,4 0 0,0 6,17A4,4 0 0,0 10,21A4,4 0 0,0 14,17V7H18V3H12Z',
			'mdi:video':
				'M17,10.5V7A1,1 0 0,0 16,6H4A1,1 0 0,0 3,7V17A1,1 0 0,0 4,18H16A1,1 0 0,0 17,17V13.5L21,17.5V6.5L17,10.5Z',
			'mdi:calendar':
				'M19,3H18V1H16V3H8V1H6V3H5C3.89,3 3,3.9 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3M19,19H5V8H19V19Z',
			'mdi:map':
				'M15,19L9,16.89V5L15,7.11M20.5,3C20.44,3 20.39,3 20.34,3L15,5.1L9,3L3.36,4.9C3.15,4.97 3,5.15 3,5.38V20.5A0.5,0.5 0 0,0 3.5,21C3.55,21 3.6,21 3.66,20.97L9,18.9L15,21L20.64,19.1C20.85,19.03 21,18.85 21,18.62V3.5A0.5,0.5 0 0,0 20.5,3Z',
			'mdi:weather-sunny':
				'M12,7A5,5 0 0,0 7,12A5,5 0 0,0 12,17A5,5 0 0,0 17,12A5,5 0 0,0 12,7M12,9A3,3 0 0,1 15,12A3,3 0 0,1 12,15A3,3 0 0,1 9,12A3,3 0 0,1 12,9M12,2L13.09,8.26L22,9L13.09,9.74L12,16L10.91,9.74L2,9L10.91,8.26L12,2Z'
		};

		// Extract icon name from iconify format (e.g., "mdi:settings" -> "mdi:settings")
		const iconKey = iconName || 'mdi:settings';
		return iconMap[iconKey] || iconMap['mdi:settings'];
	}
</script>

	<div
		class="grid-item relative group {item.bgColor} text-white cursor-pointer {editMode && isSelected
			? 'selected'
			: ''} {isRemoving
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
								? `animate-float-edit-${animationPattern + 1}`
								: !editMode && !isDragging
									? 'opacity-100'
									: ''} {isDragOver ? 'ring-2 ring-white ring-opacity-50' : ''} {editMode
			? 'edit-mode'
			: 'normal-mode'} size-{item.size}"
		data-item-id={item.id}
		style="grid-column: {itemDimensions.gridColumn}; grid-row: {itemDimensions.gridRow}; transform-origin: center; --icon-scale: {editMode ? '0.75' : '1'}; {editMode && !isSelected
			? `animation-delay: ${animationDelay}s; animation-duration: ${animationDuration}s;`
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

	<div class="relative flex flex-col items-center justify-center w-full h-full p-2">
		<div class="flex flex-col items-center justify-center h-full w-full">
			<div class="icon-container" style="transform: scale({storeEditMode ? '0.75' : '1'}) !important; transition: transform 200ms ease-in-out !important; background: {storeEditMode ? 'rgba(255,0,0,0.1)' : 'rgba(0,255,0,0.1)'};">
				<Icon icon={item.icon} width="48" height="48" />
			</div>
			{#if item.size !== '1x1'}
				<span class="absolute bottom-2 left-2 text-sm mt-2 font-medium"
					>{item.name}</span
				>
			{/if}
		</div>
	</div>

	<!-- Edit mode controls - only show for selected item -->
	{#if editMode}
		<!-- Remove button (top right) - only for selected item -->
		{#if !isDragging}
			{#if isSelected}
				<button
					class="absolute -top-2 -right-2 w-8 h-8 bg-black border-2 border-white rounded-full flex items-center justify-center text-white text-xs font-bold transition-all duration-300 ease-in-out opacity-100 scale-100 z-20"
					on:click={handleRemove}
				>
					<Icon icon="ri:unpin-fill" width="18" height="18" />
				</button>
			{/if}
		{/if}

		<!-- Resize button (bottom right) - only for selected item -->
		{#if isSelected}
			{#if !isDragging}
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
			{/if}
		{/if}
	{/if}

	<!-- Drag indicator (when dragging) -->
	{#if isDragging}
		<div
			class="absolute inset-0 border-opacity-50 flex items-center justify-center bg-black h-1 w-1"
		>
			<!-- <Icon icon={item.icon} width="24" height="24" class="text-white opacity-50" /> -->
		</div>
	{/if}
</div>

<style>
	.grid-item {
		min-height: 60px;
		min-width: 60px;
		transition:
			transform 300ms ease-in-out,
			opacity 300ms ease-in-out;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		box-sizing: border-box;
		overflow: visible;
	}

	/* Size classes for different tile sizes - now handled by CSS Grid */
	/* Grid positioning is handled by grid-row and grid-column properties */

	/* Icon transition for edit mode */
	.grid-item :global(svg) {
		transition: width 200ms ease-in-out, height 200ms ease-in-out;
	}

	/* Removed conflicting CSS - using inline styles instead */

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

	/* Edit mode float animation patterns - for non-selected items */
	@keyframes float-edit-1 {
		0%, 100% { transform: translateY(0px) translateX(0px) scale(0.9); }
		25% { transform: translateY(-8px) translateX(5px) scale(0.9); }
		50% { transform: translateY(-3px) translateX(-6px) scale(0.9); }
		75% { transform: translateY(-6px) translateX(3px) scale(0.9); }
	}

	@keyframes float-edit-2 {
		0%, 100% { transform: translateY(0px) translateX(0px) scale(0.9); }
		20% { transform: translateY(-6px) translateX(-4px) scale(0.9); }
		40% { transform: translateY(-2px) translateX(7px) scale(0.9); }
		60% { transform: translateY(-9px) translateX(-2px) scale(0.9); }
		80% { transform: translateY(-4px) translateX(5px) scale(0.9); }
	}

	@keyframes float-edit-3 {
		0%, 100% { transform: translateY(0px) translateX(0px) scale(0.9); }
		30% { transform: translateY(-5px) translateX(8px) scale(0.9); }
		60% { transform: translateY(-7px) translateX(-3px) scale(0.9); }
		90% { transform: translateY(-2px) translateX(6px) scale(0.9); }
	}

	@keyframes float-edit-4 {
		0%, 100% { transform: translateY(0px) translateX(0px) scale(0.9); }
		15% { transform: translateY(-4px) translateX(-7px) scale(0.9); }
		35% { transform: translateY(-8px) translateX(4px) scale(0.9); }
		55% { transform: translateY(-1px) translateX(-5px) scale(0.9); }
		75% { transform: translateY(-6px) translateX(2px) scale(0.9); }
		95% { transform: translateY(-3px) translateX(-8px) scale(0.9); }
	}

	.animate-float-edit-1 {
		animation: float-edit-1 ease-in-out infinite;
		opacity: 0.6;
		transform: scale(0.9);
		transition: transform 200ms ease-out;
	}

	.animate-float-edit-2 {
		animation: float-edit-2 ease-in-out infinite;
		opacity: 0.6;
		transform: scale(0.9);
		transition: transform 200ms ease-out;
	}

	.animate-float-edit-3 {
		animation: float-edit-3 ease-in-out infinite;
		opacity: 0.6;
		transform: scale(0.9);
		transition: transform 200ms ease-out;
	}

	.animate-float-edit-4 {
		animation: float-edit-4 ease-in-out infinite;
		opacity: 0.6;
		transform: scale(0.9);
		transition: transform 200ms ease-out;
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
		from {
			transform: scale(1);
			opacity: 1;
		}
		to {
			transform: scale(0);
			opacity: 0;
		}
	}

	.animate-removal {
		animation: removal 250ms ease-in forwards !important;
		pointer-events: none !important;
		transition: none !important;
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
		animation: removal 250ms ease-in forwards !important;
		pointer-events: none !important;
		transition: none !important;
	}

	/* Additional specificity for removal animation */
	div.animate-removal {
		animation: removal 250ms ease-in forwards !important;
		pointer-events: none !important;
		transition: none !important;
	}

	/* Highest priority for removal animation */
	.grid-item.animate-removal.animate-removal {
		animation: removal 250ms ease-in forwards !important;
		pointer-events: none !important;
		transition: none !important;
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

	/* Dragging element styles */
	.grid-item-drag {
		border-radius: 0 !important;
		user-select: none;
		-webkit-user-select: none;
		-moz-user-select: none;
		-ms-user-select: none;
	}
</style>
