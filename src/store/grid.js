import { writable } from 'svelte/store';

// Grid store for managing grid items and edit mode
function createGridStore() {
	const initialState = {
		items: [],
		editMode: false,
		selectedItemId: null,
		draggedItem: null,
		dragOverPosition: null,
		gridSize: { cols: 4, rows: 4 } // Default 4x4 grid
	};

	const { subscribe, set, update } = writable(initialState);

	// Size progression order
	const sizeOrder = ['1x1', '2x2', '4x2'];

	return {
		subscribe,

		// Add item to grid - simplified for flexbox
		addItem(item) {
			update((state) => {
				const newItem = {
					id: item.id || `item-${Date.now()}`,
					name: item.name,
					src: item.src,
					icon: item.icon,
					bgColor: item.bgColor,
					size: item.size || '1x1',
					...item
				};

				return {
					...state,
					items: [...state.items, newItem]
				};
			});
		},

		// Remove item from grid - simplified for flexbox
		removeItem(itemId) {
			update((state) => {
				const updatedItems = state.items.filter((item) => item.id !== itemId);
				return {
					...state,
					items: updatedItems
				};
			});
		},

		// Update item size - simplified for flexbox
		updateItemSize(itemId) {
			update((state) => {
				const itemIndex = state.items.findIndex((item) => item.id === itemId);
				if (itemIndex === -1) {
					return state;
				}

				const currentSize = state.items[itemIndex].size;
				const currentIndex = sizeOrder.indexOf(currentSize);
				const nextIndex = (currentIndex + 1) % sizeOrder.length;
				const newSize = sizeOrder[nextIndex];

				// Update the item size - flexbox handles positioning automatically
				const updatedItems = [...state.items];
				updatedItems[itemIndex] = {
					...updatedItems[itemIndex],
					size: newSize
				};

				return {
					...state,
					items: updatedItems
				};
			});
		},

		// Move item - improved to handle different sizes and grid positions
		moveItem(itemId, targetItemId) {
			update((state) => {
				const items = [...state.items];
				const draggedItemIndex = items.findIndex((item) => item.id === itemId);
				const targetItemIndex = items.findIndex((item) => item.id === targetItemId);

				if (draggedItemIndex === -1 || targetItemIndex === -1) return state;

				const draggedItem = items[draggedItemIndex];

				// Remove the dragged item
				items.splice(draggedItemIndex, 1);

				// Find the new index for the target item (it may have shifted after removing the dragged item)
				const newTargetIndex = items.findIndex((item) => item.id === targetItemId);

				// Insert the dragged item at the target position
				items.splice(newTargetIndex, 0, draggedItem);

				return {
					...state,
					items
				};
			});
		},

		// Optimize grid layout to minimize gaps and improve visual order
		optimizeLayout() {
			update((state) => {
				const items = [...state.items];

				// Sort items by size (larger items first) for better packing
				const sortedItems = items.sort((a, b) => {
					const sizeOrder = { '4x2': 2, '2x2': 1, '1x1': 0 };
					return sizeOrder[b.size] - sizeOrder[a.size];
				});

				return {
					...state,
					items: sortedItems
				};
			});
		},

		// Move item by index (legacy support)
		moveItemByIndex(itemId, newIndex) {
			update((state) => {
				const items = [...state.items];
				const itemIndex = items.findIndex((item) => item.id === itemId);

				if (itemIndex === -1) return state;

				const [item] = items.splice(itemIndex, 1);
				items.splice(newIndex, 0, item);

				return {
					...state,
					items
				};
			});
		},

		// Move item to a specific position index
		moveItemToPosition(itemId, positionIndex) {
			update((state) => {
				const items = [...state.items];
				const itemIndex = items.findIndex((item) => item.id === itemId);

				if (itemIndex === -1) return state;

				const [item] = items.splice(itemIndex, 1);

				// Clamp position to valid range
				const clampedPosition = Math.max(0, Math.min(items.length, positionIndex));
				items.splice(clampedPosition, 0, item);

				return {
					...state,
					items
				};
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

		// Initialize with default items
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
				}
			];

			set({
				items: defaultItems,
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
