import { writable } from 'svelte/store';
import { homescreenStore } from './homescreen.js';
import { getAccentColor } from '../utils/theme.js';
import {
	GRID_COLS,
	SIZE_ORDER,
	getSpan,
	getRect,
	findFreeSpot,
	assignPositions,
	resolveOverlaps
} from '../utils/gridLayout.js';

// Grid store for managing grid items and edit mode
function createGridStore() {
	// Load initial items from homescreen store, migrating any legacy items
	// (which lacked explicit coordinates) to the coordinate-based layout.
	const homescreenState = homescreenStore.getState();
	const initialItems = assignPositions(homescreenState.items || [], GRID_COLS);

	const initialState = {
		items: initialItems,
		editMode: false,
		selectedItemId: null,
		draggedItem: null,
		dragOverPosition: null,
		gridSize: { cols: GRID_COLS, rows: 4 }
	};

	const { subscribe, set, update } = writable(initialState);

	// Size progression order
	const sizeOrder = SIZE_ORDER;

	return {
		subscribe,

		// Add item to grid at the first free coordinate.
		addItem(item) {
			update((state) => {
				if (state.items.some((i) => i.id === item.id)) {
					return state;
				}

				const size = item.size || '1x1';
				const { w, h } = getSpan(size);
				const occupied = state.items.map(getRect);
				const spot = findFreeSpot(occupied, w, h, GRID_COLS);

				const newItem = {
					id: item.id || `item-${Date.now()}`,
					name: item.name,
					src: item.src,
					icon: item.icon,
					bgColor: item.bgColor || getAccentColor(),
					size,
					...item,
					col: spot.col,
					row: spot.row
				};

				const newItems = [...state.items, newItem];
				homescreenStore.updateItems(newItems);

				return { ...state, items: newItems };
			});
		},

		// Remove item from grid (leaves the cells empty - gaps are allowed).
		removeItem(itemId) {
			update((state) => {
				const updatedItems = state.items.filter((item) => item.id !== itemId);
				homescreenStore.updateItems(updatedItems);
				return { ...state, items: updatedItems };
			});
		},

		// Cycle item size and reflow any tiles the larger footprint collides with.
		updateItemSize(itemId) {
			update((state) => {
				const itemIndex = state.items.findIndex((item) => item.id === itemId);
				if (itemIndex === -1) return state;

				const currentSize = state.items[itemIndex].size;
				const currentIndex = sizeOrder.indexOf(currentSize);
				const nextIndex = (currentIndex + 1) % sizeOrder.length;
				const newSize = sizeOrder[nextIndex];

				let updatedItems = [...state.items];
				updatedItems[itemIndex] = { ...updatedItems[itemIndex], size: newSize };

				// The resized tile keeps its position; collisions are pushed away.
				updatedItems = resolveOverlaps(updatedItems, GRID_COLS, itemId);

				homescreenStore.updateItems(updatedItems);
				return { ...state, items: updatedItems };
			});
		},

		// Replace all item positions at once (used after a drag/drop commit).
		setPositions(items) {
			update((state) => {
				const cleaned = resolveOverlaps(items, GRID_COLS, state.draggedItem);
				homescreenStore.updateItems(cleaned);
				return { ...state, items: cleaned };
			});
		},

		// Set a single item's coordinates, pushing collisions out of the way.
		setItemPosition(itemId, col, row) {
			update((state) => {
				let items = state.items.map((it) =>
					it.id === itemId ? { ...it, col, row } : { ...it }
				);
				items = resolveOverlaps(items, GRID_COLS, itemId);
				homescreenStore.updateItems(items);
				return { ...state, items };
			});
		},

		// Set edit mode
		setEditMode(editMode) {
			update((state) => ({
				...state,
				editMode,
				selectedItemId: editMode ? state.selectedItemId : null
			}));
		},

		// Set selected item
		setSelectedItem(itemId) {
			update((state) => ({
				...state,
				selectedItemId: itemId
			}));
		},

		// Set dragged item
		setDraggedItem(itemId) {
			update((state) => ({
				...state,
				draggedItem: itemId
			}));
		},

		// Set drag over position
		setDragOverPosition(position) {
			update((state) => ({
				...state,
				dragOverPosition: position
			}));
		},

		// Clear drag state
		clearDragState() {
			update((state) => ({
				...state,
				draggedItem: null,
				dragOverPosition: null
			}));
		},

		// Set grid size
		setGridSize(cols, rows) {
			update((state) => ({
				...state,
				gridSize: { cols, rows }
			}));
		},

		// Load items from homescreen store (migrating legacy items to coordinates).
		loadFromHomescreen() {
			const homescreenState = homescreenStore.getState();
			const items = assignPositions(homescreenState.items || [], GRID_COLS);
			// Persist migrated coordinates so they stick across sessions.
			homescreenStore.updateItems(items);
			set({
				items,
				editMode: false,
				selectedItemId: null,
				draggedItem: null,
				dragOverPosition: null,
				gridSize: { cols: GRID_COLS, rows: 4 }
			});
		},

		// Initialize with default items (deprecated - use loadFromHomescreen instead)
		initializeDefaultItems() {
			const defaultItems = [
				// Row 1: Large tile on left, small tiles on right
				{
					id: 'app-a',
					name: 'Me',
					src: '/settings',
					icon: 'mdi:account',
					bgColor: 'bg-blue-500',
					size: '2x2'
				},
				{
					id: 'app-b',
					name: 'Paula',
					src: '/settings',
					icon: 'mdi:message',
					bgColor: 'bg-green-500',
					size: '1x1'
				},
				{
					id: 'app-c',
					name: 'Messages',
					src: '/settings',
					icon: 'mdi:chat',
					bgColor: 'bg-purple-500',
					size: '1x1'
				},
				{
					id: 'app-d',
					name: 'IE',
					src: '/settings',
					icon: 'mdi:earth',
					bgColor: 'bg-orange-500',
					size: '2x2'
				},
				// Row 2: Mixed sizes
				{
					id: 'app-e',
					name: 'Email',
					src: '/settings',
					icon: 'mdi:email',
					bgColor: 'bg-red-500',
					size: '1x1'
				},
				{
					id: 'app-f',
					name: 'Store',
					src: '/settings',
					icon: 'mdi:store',
					bgColor: 'bg-yellow-500',
					size: '1x1'
				},
				{
					id: 'app-g',
					name: 'Popcorn',
					src: '/settings',
					icon: 'mdi:popcorn',
					bgColor: 'bg-pink-500',
					size: '1x1'
				},
				{
					id: 'app-h',
					name: 'Office',
					src: '/settings',
					icon: 'mdi:office-building',
					bgColor: 'bg-indigo-500',
					size: '2x2'
				},
				// Row 3: Wide tile spanning full width
				{
					id: 'app-i',
					name: 'Calendar',
					src: '/settings',
					icon: 'mdi:calendar',
					bgColor: 'bg-cyan-500',
					size: '4x2'
				},
				{
					id: 'app-j',
					name: 'Me',
					src: '/settings',
					icon: 'mdi:account',
					bgColor: 'bg-blue-500',
					size: '2x2'
				},
				{
					id: 'app-k',
					name: 'Paula',
					src: '/settings',
					icon: 'mdi:message',
					bgColor: 'bg-green-500',
					size: '1x1'
				},
				{
					id: 'app-l',
					name: 'Messages',
					src: '/settings',
					icon: 'mdi:chat',
					bgColor: 'bg-purple-500',
					size: '1x1'
				},
				{
					id: 'app-m',
					name: 'IE',
					src: '/settings',
					icon: 'mdi:earth',
					bgColor: 'bg-orange-500',
					size: '2x2'
				},
				// Row 2: Mixed sizes
				{
					id: 'app-n',
					name: 'Email',
					src: '/settings',
					icon: 'mdi:email',
					bgColor: 'bg-red-500',
					size: '1x1'
				},
				{
					id: 'app-o',
					name: 'Store',
					src: '/settings',
					icon: 'mdi:store',
					bgColor: 'bg-yellow-500',
					size: '1x1'
				},
				{
					id: 'app-p',
					name: 'Popcorn',
					src: '/settings',
					icon: 'mdi:popcorn',
					bgColor: 'bg-pink-500',
					size: '1x1'
				},
				{
					id: 'app-q',
					name: 'Office',
					src: '/settings',
					icon: 'mdi:office-building',
					bgColor: 'bg-indigo-500',
					size: '2x2'
				},
				// Row 3: Wide tile spanning full width
				{
					id: 'app-r',
					name: 'Calendar',
					src: '/settings',
					icon: 'mdi:calendar',
					bgColor: 'bg-cyan-500',
					size: '4x2'
				}
			];

			// Save default items to homescreen store
			// homescreenStore.updateItems(defaultItems);
			
			set({
				// items: defaultItems,
				items: [],
				editMode: false,
				selectedItemId: null,
				draggedItem: null,
				dragOverPosition: null,
				gridSize: { cols: 4, rows: 4 }
			});
		}
	};
}

export const gridStore = createGridStore();
