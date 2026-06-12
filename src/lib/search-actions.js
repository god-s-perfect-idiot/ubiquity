import {
	performSearch,
	getAvailableEngines,
	getSearchSuggestions,
	SearchResult,
	groupResults
} from './search-utils.js';
import { searchLocal } from './local-search-index.js';
import { evaluateSmartSearch } from './smart-search.js';
import { RESULT_GROUPS } from './search-types.js';
import { settingsStore } from '../store/settings.js';

function toSearchResult(item) {
	if (item instanceof SearchResult) return item;
	return new SearchResult(item);
}

/**
 * Search actions — unified Spotlight-style search across local + web
 */
export const searchActions = {
	/**
	 * Unified search: smart answers, local results, then web
	 * @param {string} query
	 * @param {Object} options
	 * @returns {Promise<{ results: Array, groups: Array, query: string }>}
	 */
	async unifiedSearch(query, options = {}) {
		const trimmed = query.trim();
		if (!trimmed) {
			return { results: [], groups: [], query: trimmed };
		}

		const includeWeb = options.includeWeb !== false;
		const maxLocal = options.maxLocal ?? 12;
		const maxWeb = options.maxWeb ?? (settingsStore.get('search.maxResults') || 10);

		const smartResults = evaluateSmartSearch(trimmed).map(toSearchResult);
		const localResults = searchLocal(trimmed, maxLocal).map(toSearchResult);

		let webResults = [];
		if (includeWeb) {
			try {
				const engine = settingsStore.get('search.defaultEngine') || 'AUTO';
				webResults = await performSearch(trimmed, engine, 'general', 0, maxWeb);
			} catch (error) {
				console.error('Web search error:', error);
			}
		}

		const results = [...smartResults, ...localResults, ...webResults];
		const groups = groupResults(results);

		return { results, groups, query: trimmed };
	},

	/** @deprecated Use unifiedSearch — kept for compatibility */
	async search(query, category = 'general', page = 0) {
		const { results } = await this.unifiedSearch(query, { includeWeb: true });
		return results;
	},

	async searchWithEngine(query, engine, category = 'general', page = 0) {
		try {
			return await performSearch(query, engine, category, page);
		} catch (error) {
			console.error(`Search error with ${engine}:`, error);
			throw new Error(`Search with ${engine} failed: ${error.message}`);
		}
	},

	async getSuggestions(query) {
		try {
			return await getSearchSuggestions(query);
		} catch (error) {
			console.error('Suggestions error:', error);
			return [];
		}
	},

	setDefaultEngine(engine) {
		const availableEngines = getAvailableEngines();
		const engineExists = availableEngines.some((e) => e.key === engine);

		if (engineExists) {
			settingsStore.set('search.defaultEngine', engine);
			return true;
		}

		console.error('Invalid search engine:', engine);
		return false;
	},

	getDefaultEngine() {
		return settingsStore.get('search.defaultEngine') || 'AUTO';
	},

	updateSettings(settings) {
		const allowedSettings = [
			'search.defaultEngine',
			'search.maxResults',
			'search.safeSearch'
		];

		const filteredSettings = {};
		Object.entries(settings).forEach(([key, value]) => {
			if (allowedSettings.includes(key)) {
				filteredSettings[key] = value;
			}
		});

		settingsStore.updateSettings(filteredSettings);
	},

	getSettings() {
		return {
			defaultEngine: settingsStore.get('search.defaultEngine') || 'AUTO',
			maxResults: settingsStore.get('search.maxResults') || 10,
			safeSearch: settingsStore.get('search.safeSearch') ?? true
		};
	},

	getAvailableEngines() {
		return getAvailableEngines();
	},

	async testEngine(engine) {
		try {
			const results = await performSearch('earth', engine, 'general', 0, 3);
			return results.length >= 0;
		} catch (error) {
			console.error(`Engine ${engine} test failed:`, error);
			return false;
		}
	}
};
