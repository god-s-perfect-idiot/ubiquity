import { writable } from 'svelte/store';
import { browser } from '$app/environment';

const STORAGE_KEY = 'ubiquity-app-info';

// Initialize appInfo store with localStorage persistence
function createAppInfoStore() {
	// Load from localStorage or start with empty object
	const loadFromStorage = () => {
		if (!browser) return {};
		
		try {
			const stored = localStorage.getItem(STORAGE_KEY);
			if (stored) {
				return JSON.parse(stored);
			}
		} catch (error) {
			console.error('Error loading app info from localStorage:', error);
		}
		
		return {};
	};

	const initialState = {
		apps: loadFromStorage()
	};

	const { subscribe, update } = writable(initialState);

	// Save to localStorage
	const saveToStorage = (apps) => {
		if (!browser) return;
		
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
		} catch (error) {
			console.error('Error saving app info to localStorage:', error);
		}
	};

	return {
		subscribe,

		// Add or update app info
		// Key can be app name or URL
		setAppInfo(key, info) {
			update((state) => {
				const newApps = {
					...state.apps,
					[key]: info
				};
				saveToStorage(newApps);
				
				return {
					...state,
					apps: newApps
				};
			});
		},

		// Get app info by key (name or URL)
		getAppInfo(key) {
			let appInfo = null;
			update((state) => {
				appInfo = state.apps[key] || null;
				return state;
			});
			return appInfo;
		},

		// Remove app info
		removeAppInfo(key) {
			update((state) => {
				const newApps = { ...state.apps };
				delete newApps[key];
				saveToStorage(newApps);
				
				return {
					...state,
					apps: newApps
				};
			});
		},

		// Get current state (for synchronous access)
		getState() {
			let currentState = { apps: {} };
			update((state) => {
				currentState = state;
				return state;
			});
			return currentState;
		},

		// Reset all app info
		resetAll() {
			update(() => {
				const emptyState = { apps: {} };
				saveToStorage({});
				return emptyState;
			});
		}
	};
}

export const appInfoStore = createAppInfoStore();

