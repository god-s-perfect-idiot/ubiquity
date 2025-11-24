import { writable } from 'svelte/store';
import { browser } from '$app/environment';

const STORAGE_KEY = 'ubiquity-homescreen-config';

// Initialize homescreen store with localStorage persistence
function createHomescreenStore() {
	// Load from localStorage or start with empty array
	const loadFromStorage = () => {
		if (!browser) return [];
		
		try {
			const stored = localStorage.getItem(STORAGE_KEY);
			if (stored) {
				return JSON.parse(stored);
			}
		} catch (error) {
			console.error('Error loading homescreen config from localStorage:', error);
		}
		
		return [];
	};

	const initialState = {
		items: loadFromStorage()
	};

	const { subscribe, update } = writable(initialState);

	// Save to localStorage
	const saveToStorage = (items) => {
		if (!browser) return;
		
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
		} catch (error) {
			console.error('Error saving homescreen config to localStorage:', error);
		}
	};

	return {
		subscribe,

		// Add item to homescreen
		addItem(item) {
			update((state) => {
				// Check if item already exists
				const exists = state.items.some((i) => i.id === item.id);
				if (exists) {
					return state;
				}

				// Only save minimal data - exclude bgColor and iconSrc (these come from appInfo)
				const newItem = {
					id: item.id || `homescreen-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
					name: item.name,
					src: item.src || item.content,
					icon: item.icon || 'mdi:application', // Iconify icon (fallback)
					size: item.size || '1x1'
				};

				const newItems = [...state.items, newItem];
				saveToStorage(newItems);
				
				return {
					...state,
					items: newItems
				};
			});
		},

		// Remove item from homescreen
		removeItem(itemId) {
			update((state) => {
				const newItems = state.items.filter((item) => item.id !== itemId);
				saveToStorage(newItems);
				
				return {
					...state,
					items: newItems
				};
			});
		},

		// Update items (for reordering, resizing, etc.)
		updateItems(items) {
			update((state) => {
				saveToStorage(items);
				return {
					...state,
					items
				};
			});
		},

		// Get current state (for synchronous access)
		getState() {
			let currentState = { items: [] };
			update((state) => {
				currentState = state;
				return state;
			});
			return currentState;
		},

		// Reset all homescreen data
		resetAll() {
			update(() => {
				const emptyState = { items: [] };
				saveToStorage([]);
				return emptyState;
			});
		}
	};
}

export const homescreenStore = createHomescreenStore();

