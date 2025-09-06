import { performSearch, getAvailableEngines, getSearchSuggestions } from './search-utils.js';
import { settingsStore } from '../store/settings.js';

/**
 * Search actions that integrate with the settings store
 */
export const searchActions = {
	/**
	 * Perform a search with the current settings
	 * @param {string} query - Search query
	 * @param {string} category - Search category (optional)
	 * @param {number} page - Page number (optional)
	 * @returns {Promise<Array>} - Search results
	 */
	async search(query, category = 'general', page = 0) {
		try {
			console.log('Starting search:', { query, category, page });
			
			// Get search settings from store
			const searchEngine = settingsStore.get('search.defaultEngine') || 'DUCKDUCKGO';
			const maxResults = settingsStore.get('search.maxResults') || 10;
			// Perform the search
			const results = await performSearch(query, searchEngine, category, page);
			
			// Limit results based on settings
			const limitedResults = results.slice(0, maxResults);
			
			console.log(`Search completed: ${limitedResults.length} results`);
			return limitedResults;
			
		} catch (error) {
			console.error('Search error:', error);
			throw new Error(`Search failed: ${error.message}`);
		}
	},

	/**
	 * Search with a specific engine
	 * @param {string} query - Search query
	 * @param {string} engine - Search engine key
	 * @param {string} category - Search category (optional)
	 * @param {number} page - Page number (optional)
	 * @returns {Promise<Array>} - Search results
	 */
	async searchWithEngine(query, engine, category = 'general', page = 0) {
		try {
			console.log('Starting search with specific engine:', { query, engine, category, page });
			
			const results = await performSearch(query, engine, category, page);
			
			console.log(`Search with ${engine} completed: ${results.length} results`);
			return results;
			
		} catch (error) {
			console.error(`Search error with ${engine}:`, error);
			throw new Error(`Search with ${engine} failed: ${error.message}`);
		}
	},

	/**
	 * Get search suggestions
	 * @param {string} query - Partial search query
	 * @returns {Promise<Array<string>>} - Search suggestions
	 */
	async getSuggestions(query) {
		try {
			const suggestions = await getSearchSuggestions(query);
			return suggestions;
		} catch (error) {
			console.error('Suggestions error:', error);
			return [];
		}
	},


	/**
	 * Set default search engine
	 * @param {string} engine - Search engine key
	 * @returns {boolean} - Success status
	 */
	setDefaultEngine(engine) {
		const availableEngines = getAvailableEngines();
		const engineExists = availableEngines.some(e => e.key === engine);
		
		if (engineExists) {
			settingsStore.set('search.defaultEngine', engine);
			console.log('Default search engine set to:', engine);
			return true;
		}
		
		console.error('Invalid search engine:', engine);
		return false;
	},

	/**
	 * Get default search engine
	 * @returns {string} - Default search engine key
	 */
	getDefaultEngine() {
		return settingsStore.get('search.defaultEngine') || 'SEARXNG';
	},

	/**
	 * Set search settings
	 * @param {Object} settings - Search settings
	 */
	updateSettings(settings) {
		const allowedSettings = [
			'search.defaultEngine',
			'search.maxResults',
			'search.safeSearch'
		];

		// Filter to only allowed settings
		const filteredSettings = {};
		Object.entries(settings).forEach(([key, value]) => {
			if (allowedSettings.includes(key)) {
				filteredSettings[key] = value;
			}
		});

		// Use updateSettings to ensure proper saving to localStorage
		settingsStore.updateSettings(filteredSettings);
	},

	/**
	 * Get search settings
	 * @returns {Object} - Current search settings
	 */
	getSettings() {
		return {
			defaultEngine: settingsStore.get('search.defaultEngine') || 'DUCKDUCKGO',
			maxResults: settingsStore.get('search.maxResults') || 10,
			safeSearch: settingsStore.get('search.safeSearch') ?? true,
		};
	},


	/**
	 * Get available search engines
	 * @returns {Array} - Available search engines
	 */
	getAvailableEngines() {
		return getAvailableEngines();
	},

	/**
	 * Test search engine connectivity
	 * @param {string} engine - Search engine key
	 * @returns {Promise<boolean>} - Connectivity status
	 */
	async testEngine(engine) {
		try {
			const results = await performSearch('test', engine, 'general', 0);
			return results.length >= 0; // Even 0 results means the engine is working
		} catch (error) {
			console.error(`Engine ${engine} test failed:`, error);
			return false;
		}
	}
};
