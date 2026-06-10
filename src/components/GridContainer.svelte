<script>
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { gridStore } from '../store/grid.js';
	import GridItem from './GridItem.svelte';
	import { backgroundClassStore } from '../utils/theme';
	import {
		GRID_COLS,
		getSpan,
		getRect,
		rectsOverlap,
		clampCol,
		findFreeSpot,
		usedRows
	} from '../utils/gridLayout.js';

	export let cols = GRID_COLS;
	export let scrollContainer = null;

	const GAP = 12; // px gap between cells
	const PAD = 16; // px padding around the grid (matches Tailwind p-4)
	const LONG_PRESS_MS = 450;
	const DRAG_THRESHOLD = 8; // px before a press becomes a drag

	$: bgClass = $backgroundClassStore;

	$: gridState = $gridStore;
	$: editMode = gridState.editMode;
	$: selectedItemId = gridState.selectedItemId;
	$: items = gridState.items;

	let gridEl;
	let containerWidth = 0;
	let resizeObserver;

	// --- Drag / interaction state -------------------------------------------
	let pressId = null; // tile currently pressed (drag not yet started)
	let pressTimer = null;
	let pressStart = { x: 0, y: 0 };
	let pressMoved = false;

	let draggingId = null; // tile currently being dragged
	let dragOffset = { x: 0, y: 0 }; // pointer offset within the tile
	let floatX = 0;
	let floatY = 0;
	let draggedOrigin = null; // committed {col,row} where the drag began
	let targetCell = null; // current snap target {col,row}
	let lastTargetKey = '';
	let previewPositions = {}; // id -> {col,row} for tiles making room

	let autoScrollInterval = null;
	const autoScrollSpeed = 14; // px per tick

	let removingId = null; // tile currently playing its shrink-away animation

	// --- Derived geometry ----------------------------------------------------
	$: cellSize =
		containerWidth > 0
			? Math.max(40, (containerWidth - PAD * 2 - GAP * (cols - 1)) / cols)
			: 0;
	$: step = cellSize + GAP;

	// Rows needed to contain everything (plus breathing room while editing).
	$: contentRows = (() => {
		let rows = usedRows(items);
		for (const id in previewPositions) {
			const it = items.find((i) => i.id === id);
			if (it) {
				const span = getSpan(it.size);
				rows = Math.max(rows, previewPositions[id].row + span.h);
			}
		}
		if (draggingId && targetCell) {
			const it = items.find((i) => i.id === draggingId);
			if (it) rows = Math.max(rows, targetCell.row + getSpan(it.size).h);
		}
		if (editMode) rows += 2; // room to drop tiles at the bottom
		return rows;
	})();

	$: contentHeight = step > 0 && contentRows > 0 ? PAD * 2 + contentRows * step - GAP : 0;

	// Builds the inline style for a tile. All reactive dependencies are passed
	// in explicitly so Svelte re-evaluates the expression when they change
	// (it only tracks variables referenced directly in the template).
	function tileStyle(item, _cell, _step, _edit, _selected, _dragId, _fx, _fy, _preview) {
		const span = getSpan(item.size);
		const w = span.w * _cell + (span.w - 1) * GAP;
		const h = span.h * _cell + (span.h - 1) * GAP;

		if (_dragId === item.id) {
			return (
				`width:${w}px;height:${h}px;` +
				`transform:translate3d(${_fx}px,${_fy}px,0) scale(1.06);` +
				`transition:none;z-index:1000;opacity:0.92;` +
				`box-shadow:0 18px 40px rgba(0,0,0,0.45);touch-action:none;`
			);
		}

		const preview = _preview[item.id];
		const col = preview ? preview.col : getRect(item).col;
		const row = preview ? preview.row : getRect(item).row;
		const x = PAD + col * _step;
		const y = PAD + row * _step;

		const opacity = _edit && _selected !== item.id ? 0.55 : 1;

		return (
			`width:${w}px;height:${h}px;` +
			`transform:translate3d(${x}px,${y}px,0);` +
			`opacity:${opacity};z-index:1;` +
			`touch-action:${_edit ? 'none' : 'pan-y'};`
		);
	}

	// --- Pointer helpers -----------------------------------------------------
	function pointInContainer(e) {
		const rect = gridEl.getBoundingClientRect();
		return { x: e.clientX - rect.left, y: e.clientY - rect.top };
	}

	function cellFromFloat() {
		if (step <= 0) return { col: 0, row: 0 };
		const it = items.find((i) => i.id === draggingId);
		const span = it ? getSpan(it.size) : { w: 1, h: 1 };
		let col = Math.round((floatX - PAD) / step);
		let row = Math.round((floatY - PAD) / step);
		col = clampCol(col, span.w, cols);
		row = Math.max(0, row);
		return { col, row };
	}

	// Recompute which tiles need to move out of the dragged tile's way.
	function recomputePreview() {
		if (!draggingId || !targetCell) {
			previewPositions = {};
			return;
		}
		const dragged = items.find((i) => i.id === draggingId);
		if (!dragged) return;
		const span = getSpan(dragged.size);
		const footprint = { col: targetCell.col, row: targetCell.row, w: span.w, h: span.h };

		const others = items.filter((i) => i.id !== draggingId);
		const overlapping = others.filter((o) => rectsOverlap(getRect(o), footprint));
		const kept = others.filter((o) => !rectsOverlap(getRect(o), footprint));

		const preview = {};

		// Clean swap: dropping a tile squarely onto a single same-sized tile
		// sends that tile back to where the dragged tile came from.
		if (
			overlapping.length === 1 &&
			draggedOrigin &&
			!rectsOverlap(
				{ col: draggedOrigin.col, row: draggedOrigin.row, w: span.w, h: span.h },
				footprint
			)
		) {
			const o = overlapping[0];
			const os = getSpan(o.size);
			if (os.w === span.w && os.h === span.h) {
				preview[o.id] = { col: draggedOrigin.col, row: draggedOrigin.row };
				previewPositions = preview;
				return;
			}
		}

		// Otherwise push each overlapping tile to the next free spot.
		const occupied = kept.map(getRect);
		occupied.push(footprint);
		const movers = [...overlapping].sort((a, b) => {
			const ar = getRect(a);
			const br = getRect(b);
			return ar.row - br.row || ar.col - br.col;
		});
		for (const m of movers) {
			const ms = getSpan(m.size);
			const spot = findFreeSpot(occupied, ms.w, ms.h, cols);
			preview[m.id] = spot;
			occupied.push({ col: spot.col, row: spot.row, w: ms.w, h: ms.h });
		}

		previewPositions = preview;
	}

	// --- Press / drag lifecycle ---------------------------------------------
	function handlePointerDown(e, item) {
		if (e.button === 2) return; // ignore right click
		// Let interactive controls inside a tile (edit buttons, live-tile
		// buttons) handle their own taps.
		if (e.target.closest('button')) return;

		pressId = item.id;
		pressMoved = false;
		pressStart = { x: e.clientX, y: e.clientY };

		window.addEventListener('pointermove', handlePointerMove, { passive: false });
		window.addEventListener('pointerup', handlePointerUp);
		window.addEventListener('pointercancel', handlePointerCancel);

		if (!editMode) {
			pressTimer = setTimeout(() => {
				if (pressId === item.id && !pressMoved && !draggingId) {
					gridStore.setEditMode(true);
					gridStore.setSelectedItem(item.id);
				}
			}, LONG_PRESS_MS);
		}
	}

	function beginDrag(item) {
		draggingId = item.id;
		gridStore.setEditMode(true);
		gridStore.setSelectedItem(item.id);
		gridStore.setDraggedItem(item.id);

		const rect = getRect(item);
		draggedOrigin = { col: rect.col, row: rect.row };

		const p = pointInContainer({ clientX: pressStart.x, clientY: pressStart.y });
		const tileX = PAD + rect.col * step;
		const tileY = PAD + rect.row * step;
		dragOffset = { x: p.x - tileX, y: p.y - tileY };
		floatX = tileX;
		floatY = tileY;

		targetCell = { col: rect.col, row: rect.row };
		lastTargetKey = `${targetCell.col},${targetCell.row}`;
		previewPositions = {};
	}

	function handlePointerMove(e) {
		if (draggingId) {
			e.preventDefault();
			const p = pointInContainer(e);
			floatX = p.x - dragOffset.x;
			floatY = p.y - dragOffset.y;

			const cell = cellFromFloat();
			const key = `${cell.col},${cell.row}`;
			if (key !== lastTargetKey) {
				lastTargetKey = key;
				targetCell = cell;
				recomputePreview();
			}
			handleAutoScroll(e.clientY);
			return;
		}

		if (!pressId) return;

		const dx = e.clientX - pressStart.x;
		const dy = e.clientY - pressStart.y;
		if (Math.hypot(dx, dy) <= DRAG_THRESHOLD) return;

		pressMoved = true;
		clearTimeout(pressTimer);

		if (editMode) {
			const item = items.find((i) => i.id === pressId);
			pressId = null;
			if (item) {
				e.preventDefault();
				beginDrag(item);
			}
		} else {
			// A move outside edit mode is a scroll - let it through.
			pressId = null;
		}
	}

	function commitDrop() {
		const next = items.map((it) => {
			if (it.id === draggingId) {
				return { ...it, col: targetCell.col, row: targetCell.row };
			}
			if (previewPositions[it.id]) {
				return { ...it, col: previewPositions[it.id].col, row: previewPositions[it.id].row };
			}
			return { ...it };
		});
		gridStore.setPositions(next);
	}

	function endDrag() {
		stopAutoScroll();
		commitDrop();
		gridStore.clearDragState();
		draggingId = null;
		previewPositions = {};
		targetCell = null;
		draggedOrigin = null;
	}

	// After a drag the browser dispatches a synthetic `click`. Because the
	// dragged tile has `pointer-events:none`, that click resolves to the grid
	// background and would be read as "tapped empty space" (exiting edit mode).
	// Swallow exactly that one click so dropping a tile keeps the reorder view.
	function suppressNextClick() {
		if (typeof window === 'undefined') return;
		const handler = (ev) => {
			ev.stopPropagation();
			window.removeEventListener('click', handler, true);
			clearTimeout(cleanup);
		};
		window.addEventListener('click', handler, true);
		const cleanup = setTimeout(() => {
			window.removeEventListener('click', handler, true);
		}, 350);
	}

	function handlePointerUp(e) {
		removeWindowListeners();
		clearTimeout(pressTimer);

		if (draggingId) {
			endDrag();
			suppressNextClick();
			return;
		}

		if (pressId && !pressMoved) {
			const item = items.find((i) => i.id === pressId);
			pressId = null;
			if (!item) return;
			if (editMode) {
				gridStore.setSelectedItem(item.id);
			} else {
				navigate(item);
			}
			return;
		}
		pressId = null;
	}

	function handlePointerCancel() {
		removeWindowListeners();
		clearTimeout(pressTimer);
		stopAutoScroll();
		// Revert any in-progress drag without committing.
		draggingId = null;
		previewPositions = {};
		targetCell = null;
		draggedOrigin = null;
		pressId = null;
		gridStore.clearDragState();
	}

	function removeWindowListeners() {
		if (typeof window === 'undefined') return;
		window.removeEventListener('pointermove', handlePointerMove);
		window.removeEventListener('pointerup', handlePointerUp);
		window.removeEventListener('pointercancel', handlePointerCancel);
	}

	function navigate(item) {
		if (!item?.src) return;
		if (item.src.startsWith('http://') || item.src.startsWith('https://')) {
			window.location.href = item.src;
		} else {
			goto(item.src);
		}
	}

	// --- Tile control events -------------------------------------------------
	function handleResize(item) {
		gridStore.updateItemSize(item.id);
	}

	function handleRemove(item) {
		// Let the tile shrink away before it's actually removed from the grid.
		removingId = item.id;
		setTimeout(() => {
			gridStore.removeItem(item.id);
			if (selectedItemId === item.id) gridStore.setSelectedItem(null);
			removingId = null;
		}, 220);
	}

	// --- Auto-scroll while dragging near the edges --------------------------
	function handleAutoScroll(clientY) {
		if (!scrollContainer) return;
		const rect = scrollContainer.getBoundingClientRect();
		const threshold = 90;
		stopAutoScroll();
		if (clientY - rect.top < threshold && scrollContainer.scrollTop > 0) {
			startAutoScroll(-1);
		} else if (
			rect.bottom - clientY < threshold &&
			scrollContainer.scrollTop < scrollContainer.scrollHeight - scrollContainer.clientHeight
		) {
			startAutoScroll(1);
		}
	}

	function startAutoScroll(dir) {
		if (autoScrollInterval) return;
		autoScrollInterval = setInterval(() => {
			if (!scrollContainer || !draggingId) return stopAutoScroll();
			scrollContainer.scrollTop += dir * autoScrollSpeed;
		}, 16);
	}

	function stopAutoScroll() {
		if (autoScrollInterval) {
			clearInterval(autoScrollInterval);
			autoScrollInterval = null;
		}
	}

	// --- Lifecycle -----------------------------------------------------------
	onMount(() => {
		gridStore.loadFromHomescreen();
		if (gridEl) {
			containerWidth = gridEl.clientWidth;
			resizeObserver = new ResizeObserver((entries) => {
				for (const entry of entries) containerWidth = entry.contentRect.width;
			});
			resizeObserver.observe(gridEl);
		}
	});

	onDestroy(() => {
		stopAutoScroll();
		removeWindowListeners();
		clearTimeout(pressTimer);
		if (resizeObserver) resizeObserver.disconnect();
	});
</script>

<div class="grid-container w-full relative flex-1">
	<div
		class="wp-grid w-full relative {bgClass}"
		class:editing={editMode}
		bind:this={gridEl}
		style="height:{contentHeight}px;"
		role="grid"
		tabindex="0"
	>
		{#each items as item (item.id)}
			<div
				class="tile-wrapper"
				class:dragging={draggingId === item.id}
				data-item-id={item.id}
				style={tileStyle(item, cellSize, step, editMode, selectedItemId, draggingId, floatX, floatY, previewPositions)}
				on:pointerdown={(e) => handlePointerDown(e, item)}
			>
				<GridItem
					{item}
					{editMode}
					isSelected={selectedItemId === item.id}
					isDragging={draggingId === item.id}
					isRemoving={removingId === item.id}
					on:resize={() => handleResize(item)}
					on:remove={() => handleRemove(item)}
				/>
			</div>
		{/each}
	</div>
</div>

<style>
	.grid-container {
		overflow: visible;
		-webkit-user-select: none;
		user-select: none;
		-webkit-touch-callout: none;
	}

	.wp-grid {
		position: relative;
		min-height: 1px;
		transition: height 0.28s cubic-bezier(0.2, 0.8, 0.2, 1);
	}

	.tile-wrapper {
		position: absolute;
		top: 0;
		left: 0;
		box-sizing: border-box;
		transition:
			transform 0.28s cubic-bezier(0.2, 0.8, 0.2, 1),
			width 0.28s cubic-bezier(0.2, 0.8, 0.2, 1),
			height 0.28s cubic-bezier(0.2, 0.8, 0.2, 1),
			opacity 0.2s ease;
		will-change: transform, width, height;
		-webkit-user-select: none;
		user-select: none;
		-webkit-touch-callout: none;
	}

	.tile-wrapper.dragging {
		pointer-events: none;
	}
</style>
