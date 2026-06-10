// Windows Phone 8.1 style start-screen layout engine.
// Tiles live on an explicit coordinate grid (col/row in "small tile" units).
// This module is pure: no DOM, no stores. It just computes positions.

export const GRID_COLS = 4;

// Tile sizes expressed as a footprint in small-tile units.
export const SIZE_SPANS = {
	'1x1': { w: 1, h: 1 },
	'2x2': { w: 2, h: 2 },
	'4x2': { w: 4, h: 2 }
};

// Order used when cycling a tile through sizes on resize.
export const SIZE_ORDER = ['1x1', '2x2', '4x2'];

export function getSpan(size) {
	return SIZE_SPANS[size] || SIZE_SPANS['1x1'];
}

export function getRect(item) {
	const { w, h } = getSpan(item.size);
	return {
		col: Number.isInteger(item.col) ? item.col : 0,
		row: Number.isInteger(item.row) ? item.row : 0,
		w,
		h
	};
}

export function rectsOverlap(a, b) {
	return (
		a.col < b.col + b.w &&
		a.col + a.w > b.col &&
		a.row < b.row + b.h &&
		a.row + a.h > b.row
	);
}

// Keep a footprint of width w within the column bounds.
export function clampCol(col, w, cols = GRID_COLS) {
	return Math.max(0, Math.min(cols - w, col));
}

function rectFree(rect, occupiedRects) {
	for (const o of occupiedRects) {
		if (rectsOverlap(rect, o)) return false;
	}
	return true;
}

// First free spot (row-major, top-to-bottom, left-to-right) for a w×h tile.
export function findFreeSpot(occupiedRects, w, h, cols = GRID_COLS) {
	for (let row = 0; row < 2000; row++) {
		for (let col = 0; col <= cols - w; col++) {
			if (rectFree({ col, row, w, h }, occupiedRects)) {
				return { col, row };
			}
		}
	}
	return { col: 0, row: 0 };
}

function hasValidPosition(item) {
	return Number.isInteger(item.col) && Number.isInteger(item.row);
}

// Assign positions only to items that are missing them, keeping placed tiles put.
// Used to migrate legacy items (which only had array order) to coordinates.
export function assignPositions(items, cols = GRID_COLS) {
	const result = items.map((it) => ({ ...it }));
	const placed = [];

	for (const it of result) {
		if (hasValidPosition(it)) placed.push(getRect(it));
	}

	for (const it of result) {
		if (!hasValidPosition(it)) {
			const { w, h } = getSpan(it.size);
			const spot = findFreeSpot(placed, w, h, cols);
			it.col = spot.col;
			it.row = spot.row;
			placed.push(getRect(it));
		}
	}

	return result;
}

// Guarantee no two tiles overlap. The priority item (e.g. just-moved or
// just-resized tile) keeps its spot; everything else is relocated as needed.
// Tiles that don't collide keep their exact position, so intentional gaps stay.
export function resolveOverlaps(items, cols = GRID_COLS, priorityId = null) {
	const result = items.map((it) => ({ ...it }));

	const order = [...result].sort((a, b) => {
		if (a.id === priorityId) return -1;
		if (b.id === priorityId) return 1;
		const ar = Number.isInteger(a.row) ? a.row : 0;
		const br = Number.isInteger(b.row) ? b.row : 0;
		if (ar !== br) return ar - br;
		const ac = Number.isInteger(a.col) ? a.col : 0;
		const bc = Number.isInteger(b.col) ? b.col : 0;
		return ac - bc;
	});

	const placed = [];
	for (const it of order) {
		const span = getSpan(it.size);
		let col = clampCol(Number.isInteger(it.col) ? it.col : 0, span.w, cols);
		let row = Number.isInteger(it.row) ? it.row : 0;
		const rect = { col, row, w: span.w, h: span.h };

		if (!rectFree(rect, placed)) {
			const spot = findFreeSpot(placed, span.w, span.h, cols);
			col = spot.col;
			row = spot.row;
		}

		it.col = col;
		it.row = row;
		placed.push({ col, row, w: span.w, h: span.h });
	}

	return result;
}

// Number of rows currently occupied (used to size the scroll area).
export function usedRows(items) {
	let m = 0;
	for (const it of items) {
		const r = getRect(it);
		m = Math.max(m, r.row + r.h);
	}
	return m;
}
