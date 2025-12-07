import { writable } from 'svelte/store';
import { browser } from '$app/environment';

const STORAGE_KEY = 'ubiquity-camera-lenses';

/**
 * Lens structure:
 * {
 *   id: string,                    // Unique identifier
 *   name: string,                  // Display name
 *   icon: string,                  // Iconify icon identifier
 *   bgColor: string | null,        // Background color (hex) - uses accent color if null
 *   bgImage: string | null,        // Background image URL - if provided, used instead of bgColor + icon
 *   cssFilter: string,             // CSS filter to apply to video (e.g., 'grayscale(100%)')
 *   applyFunction: string | null,  // Canvas processing function name ('grayscale', 'pixelart', etc.)
 *   isDefault: boolean             // Whether this is a default lens (cannot be removed)
 * }
 */

// Default lenses with new structure
const DEFAULT_LENSES = [
	{
		id: 'default',
		name: 'Default',
		icon: 'iconoir:lens',
		bgColor: null, // Will use accent color
		bgImage: null,
		cssFilter: 'none',
		applyFunction: null, // null means no special processing needed
		isDefault: true
	},
	{
		id: 'black-and-white',
		name: 'Black and white',
		icon: 'material-symbols:filter-b-and-w',
		bgColor: '#2d2d2d',
		bgImage: "https://images.pexels.com/photos/5267760/pexels-photo-5267760.jpeg",
		cssFilter: 'grayscale(100%)',
		applyFunction: 'grayscale',
		isDefault: true
	},
	{
		id: 'pixel-art',
		name: 'Pixel Art',
		icon: 'material-symbols:grid-on',
		bgColor: '#1a1a1a',
		bgImage: "https://pixelartvillage.com/display.png",
		cssFilter: 'contrast(1.5) brightness(1.1)',
		applyFunction: 'pixelart',
		isDefault: true
	},
	{
		id: 'tilt-shift',
		name: 'Tilt Shift',
		icon: 'material-symbols:blur',
		bgColor: '#4a5568',
		bgImage: "https://images.pexels.com/photos/1546168/pexels-photo-1546168.jpeg",
		cssFilter: 'none',
		applyFunction: 'tiltshift',
		isDefault: true
	}
];

function createLensStore() {
	// Merge stored lenses with defaults, ensuring default lenses are always present
	const mergeWithDefaults = (storedLenses) => {
		const defaultIds = DEFAULT_LENSES.map(l => l.id);
		const merged = [...DEFAULT_LENSES];
		
		// Add stored lenses that aren't defaults
		if (Array.isArray(storedLenses)) {
			storedLenses.forEach(lens => {
				if (!defaultIds.includes(lens.id)) {
					merged.push(lens);
				}
			});
		}
		
		return merged;
	};

	// Load from localStorage or start with default lenses
	const loadFromStorage = () => {
		if (!browser) return DEFAULT_LENSES;
		
		try {
			const stored = localStorage.getItem(STORAGE_KEY);
			if (stored) {
				const parsed = JSON.parse(stored);
				// Ensure default lenses are always present
				return mergeWithDefaults(parsed);
			}
		} catch (error) {
			console.error('Error loading lenses from localStorage:', error);
		}
		
		return DEFAULT_LENSES;
	};

	const initialState = {
		lenses: loadFromStorage(),
		selectedLensId: 'default'
	};

	const { subscribe, update, set } = writable(initialState);

	// Save to localStorage
	const saveToStorage = (lenses) => {
		if (!browser) return;
		
		try {
			// Only save non-default lenses
			const lensesToSave = lenses.filter(l => !l.isDefault);
			localStorage.setItem(STORAGE_KEY, JSON.stringify(lensesToSave));
		} catch (error) {
			console.error('Error saving lenses to localStorage:', error);
		}
	};

	return {
		subscribe,

		// Get all lenses
		getLenses() {
			let currentState;
			subscribe(state => currentState = state)();
			return currentState.lenses;
		},

		// Get selected lens (for non-reactive access)
		getSelectedLens() {
			let currentState;
			subscribe(state => currentState = state)();
			return currentState.lenses.find(l => l.id === currentState.selectedLensId) || currentState.lenses[0];
		},

		// Select a lens
		selectLens(lensId) {
			update((state) => {
				const lensExists = state.lenses.some(l => l.id === lensId);
				if (lensExists) {
					return {
						...state,
						selectedLensId: lensId
					};
				}
				return state;
			});
		},

		// Add a new lens (for marketplace integration later)
		addLens(lens) {
			update((state) => {
				// Check if lens with same ID already exists
				if (state.lenses.some(l => l.id === lens.id)) {
					return state;
				}

				const newLenses = [...state.lenses, lens];
				saveToStorage(newLenses);
				
				return {
					...state,
					lenses: newLenses
				};
			});
		},

		// Remove a lens (cannot remove default lenses)
		removeLens(lensId) {
			update((state) => {
				const lens = state.lenses.find(l => l.id === lensId);
				if (lens && lens.isDefault) {
					// Cannot remove default lenses
					return state;
				}

				const newLenses = state.lenses.filter(l => l.id !== lensId);
				saveToStorage(newLenses);
				
				// If the removed lens was selected, switch to default
				const newSelectedLensId = state.selectedLensId === lensId ? 'default' : state.selectedLensId;
				
				return {
					...state,
					lenses: newLenses,
					selectedLensId: newSelectedLensId
				};
			});
		},

		// Reset to default lenses only
		reset() {
			set({
				lenses: DEFAULT_LENSES,
				selectedLensId: 'default'
			});
			saveToStorage(DEFAULT_LENSES);
		}
	};
}

export const lensStore = createLensStore();
