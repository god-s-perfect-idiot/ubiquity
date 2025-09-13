<script>
	import { createEventDispatcher } from 'svelte';
	import Icon from '@iconify/svelte';
	import { gridStore } from '../store/grid.js';

	export let item;
	export let editMode = false;
	export let isSelected = false;
	export let isDragging = false;
	export let isDragOver = false;

	const dispatch = createEventDispatcher();

	let isPressed = false;
	let pressTimer = null;
	let dragStartPosition = null;

	// Handle mouse down for long press detection
	function handleMouseDown(event) {
		if (editMode) return;

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

		if (editMode) {
			// In edit mode, don't prevent default to allow click events
			return;
		}

		event.preventDefault();
		event.stopPropagation();
		isPressed = true;
		const touch = event.touches[0];
		dragStartPosition = { x: touch.clientX, y: touch.clientY };

		// Start long press timer
		pressTimer = setTimeout(() => {
			if (isPressed) {
				dispatch('longPress', { itemId: item.id });
			}
		}, 500); // 500ms for long press
	}

	// Handle touch end
	function handleTouchEnd(event) {
		// Check if touch is on a button - if so, don't handle touch end
		const target = event.target.closest('button');
		if (target) {
			return;
		}

		if (editMode) {
			// In edit mode, don't prevent default to allow click events
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
		gridStore.removeItem(item.id);
	}

	// Handle drag start
	function handleDragStart(event) {
		if (!editMode) return;

		event.dataTransfer.setData('text/plain', item.id);
		event.dataTransfer.effectAllowed = 'move';

		dispatch('dragStart', { item });
	}

	// Handle drag end
	function handleDragEnd() {
		dispatch('dragEnd', { item });
	}

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

		if (draggedItemId !== item.id) {
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
	class="grid-item relative {item.bgColor} text-white cursor-pointer transition-all duration-500 ease-in-out {isDragging
		? 'opacity-50 scale-95'
		: ''} {isDragOver ? 'ring-2 ring-white ring-opacity-50' : ''} {editMode && !isSelected
		? 'animate-float opacity-75'
		: 'opacity-100'}"
	style="width: {editMode && !isSelected
		? item.size === '1x1'
			? 'calc(23% - 6px)'
			: item.size === '2x2'
				? 'calc(46% - 8px)'
				: 'calc(92% - 8px)'
		: item.size === '1x1'
			? 'calc(25% - 6px)'
			: item.size === '2x2'
				? 'calc(50% - 8px)'
				: 'calc(100% - 8px)'}; aspect-ratio: {item.size === '1x1'
		? '1'
		: item.size === '2x2'
			? '1'
			: '2'}; align-self: flex-start; {editMode && !isSelected
		? `animation-delay: ${0.5 + (item.id.charCodeAt(0) % 4) * 0.2}s;`
		: ''}"
	on:mousedown={handleMouseDown}
	on:mouseup={handleMouseUp}
	on:mouseleave={handleMouseLeave}
	on:touchstart={handleTouchStart}
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
				class="absolute top-1 right-1 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white text-xs font-bold transition-all duration-300 ease-in-out opacity-0 scale-75 pointer-events-none"
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
				class="absolute bottom-1 right-1 w-6 h-6 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold transition-all duration-300 ease-in-out opacity-0 scale-75 pointer-events-none"
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
	}

	.grid-item:hover {
		transform: scale(1.02);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
	}

	.grid-item:active {
		transform: scale(0.98);
	}

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

	.animate-float:nth-child(odd) {
		animation-duration: 7.5s;
	}

	.animate-float:nth-child(even) {
		animation-duration: 8.5s;
	}
</style>
