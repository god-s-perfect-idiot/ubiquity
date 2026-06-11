import { writable } from 'svelte/store';
import { browser } from '$app/environment';

const STORAGE_KEY = 'ubiquity-books-progress';

function loadState() {
	if (!browser) return { progress: {}, nightMode: false, readerFont: 'readerly' };

	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			const parsed = JSON.parse(stored);
			if (parsed.progress || parsed.nightMode !== undefined || parsed.readerFont) {
				return {
					progress: parsed.progress || {},
					nightMode: parsed.nightMode ?? false,
					readerFont: parsed.readerFont || 'readerly'
				};
			}
			return { progress: parsed, nightMode: false, readerFont: 'readerly' };
		}
	} catch (error) {
		console.error('Error loading book progress:', error);
	}

	return { progress: {}, nightMode: false, readerFont: 'readerly' };
}

function createBooksStore() {
	const initialState = loadState();
	const { subscribe, update } = writable(initialState);

	const save = (progress, nightMode, readerFont) => {
		if (!browser) return;
		try {
			localStorage.setItem(
				STORAGE_KEY,
				JSON.stringify({ progress, nightMode, readerFont })
			);
		} catch (error) {
			console.error('Error saving book progress:', error);
		}
	};

	return {
		subscribe,

		getPage(key) {
			let page = 0;
			update((state) => {
				page = state.progress[key]?.page ?? 0;
				return state;
			});
			return page;
		},

		setPage(key, page) {
			update((state) => {
				const progress = {
					...state.progress,
					[key]: { page, updatedAt: Date.now() }
				};
				save(progress, state.nightMode, state.readerFont);
				return { ...state, progress };
			});
		},

		getNightMode() {
			let nightMode = false;
			update((state) => {
				nightMode = state.nightMode ?? false;
				return state;
			});
			return nightMode;
		},

		setNightMode(nightMode) {
			update((state) => {
				save(state.progress, nightMode, state.readerFont);
				return { ...state, nightMode };
			});
		},

		getReaderFont() {
			let readerFont = 'readerly';
			update((state) => {
				readerFont = state.readerFont || 'readerly';
				return state;
			});
			return readerFont;
		},

		setReaderFont(readerFont) {
			update((state) => {
				save(state.progress, state.nightMode, readerFont);
				return { ...state, readerFont };
			});
		}
	};
}

export const booksStore = createBooksStore();
