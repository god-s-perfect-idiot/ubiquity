// Search utilities for multiple open source search engines
// Supports SearXNG, DuckDuckGo, and other privacy-focused search engines

/**
 * Search result structure
 */
export class SearchResult {
	constructor(data) {
		this.title = data.title || '';
		this.url = data.url || '';
		this.description = data.description || '';
		this.engine = data.engine || '';
		this.timestamp = data.timestamp || new Date();
		this.favicon = data.favicon || '';
		this.category = data.category || 'general';
	}
}

/**
 * Search engines configuration - Only APIs that work without CORS
 */
export const SEARCH_ENGINES = {
	DUCKDUCKGO: {
		name: 'DuckDuckGo',
		baseUrl: 'https://api.duckduckgo.com',
		apiPath: '/',
		params: {
			q: '',
			format: 'json',
			no_html: '1',
			skip_disambig: '1'
		},
		enabled: true,
		privacy: 'high'
	},
};

/**
 * Get search suggestions from DuckDuckGo
 * @param {string} query - Search query
 * @returns {Promise<Array<string>>} - Array of suggestions
 */
export async function getSearchSuggestions(query) {
	if (!query || query.length < 2) return [];
	
	try {
		const response = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`);
		const data = await response.json();
		
		// Extract suggestions from DuckDuckGo response
		const suggestions = [];
		
		// Add instant answer if available
		if (data.AbstractText) {
			suggestions.push(data.Heading || query);
		}
		
		// Add related topics
		if (data.RelatedTopics && Array.isArray(data.RelatedTopics)) {
			data.RelatedTopics.slice(0, 5).forEach(topic => {
				if (topic.Text) {
					suggestions.push(topic.Text);
				}
			});
		}
		
		// Add instant answer suggestions
		if (data.Answer) {
			suggestions.push(data.Answer);
		}
		
		// Remove duplicates and limit to 8 suggestions
		return [...new Set(suggestions)].slice(0, 8);
	} catch (error) {
		console.error('Error fetching suggestions:', error);
		return [];
	}
}

/**
 * Search categories
 */
export const SEARCH_CATEGORIES = {
	GENERAL: 'general',
	IMAGES: 'images',
	NEWS: 'news',
	VIDEOS: 'videos',
	MAPS: 'maps',
	SHOPPING: 'shopping'
};

/**
 * Perform a search using the specified engine
 * @param {string} query - Search query
 * @param {string} engine - Search engine key
 * @param {string} category - Search category
 * @param {number} page - Page number (for pagination)
 * @returns {Promise<Array<SearchResult>>}
 */
export async function performSearch(query, engine = 'DUCKDUCKGO', category = 'general', page = 0) {
	if (!query || query.trim().length === 0) {
		return [];
	}

	const engineConfig = SEARCH_ENGINES[engine];
	if (!engineConfig || !engineConfig.enabled) {
		throw new Error(`Search engine ${engine} is not available`);
	}


	try {
		console.log(`Searching with ${engineConfig.name} for: "${query}"`);
		
		const results = await searchWithEngine(query, engineConfig, category, page);
		console.log(`Found ${results.length} results from ${engineConfig.name}`);
		
		return results;
	} catch (error) {
		console.error(`Search error with ${engineConfig.name}:`, error);
		throw new Error(`Search failed: ${error.message}`);
	}
}

/**
 * Search using a specific engine
 * @param {string} query - Search query
 * @param {Object} engineConfig - Engine configuration
 * @param {string} category - Search category
 * @param {number} page - Page number
 * @returns {Promise<Array<SearchResult>>}
 */
async function searchWithEngine(query, engineConfig, category, page) {
	const url = buildSearchUrl(query, engineConfig, category, page);
	
	const headers = {
		'Accept': 'application/json',
		'User-Agent': 'Ubiquity Search/1.0'
	};

	
	const response = await fetch(url, {
		method: 'GET',
		headers
	});

	if (!response.ok) {
		throw new Error(`HTTP ${response.status}: ${response.statusText}`);
	}

	const data = await response.json();
	return parseSearchResults(data, engineConfig.name, category);
}

/**
 * Build search URL for the specified engine
 * @param {string} query - Search query
 * @param {Object} engineConfig - Engine configuration
 * @param {string} category - Search category
 * @param {number} page - Page number
 * @returns {string} - Complete search URL
 */
function buildSearchUrl(query, engineConfig, category, page) {
	const baseUrl = engineConfig.baseUrl + engineConfig.apiPath;
	const params = new URLSearchParams();
	
	// Add engine-specific parameters
	Object.entries(engineConfig.params).forEach(([key, value]) => {
		if (key === 'q' || key === 'query') {
			params.append(key, query);
		} else if (key === 'categories' && category !== 'general') {
			params.append(key, category);
		} else if (key === 'offset' && page > 0) {
			params.append(key, (page * 10).toString());
		} else {
			params.append(key, value);
		}
	});

	return `${baseUrl}?${params.toString()}`;
}

/**
 * Parse search results from different engines
 * @param {Object} data - Raw response data
 * @param {string} engineName - Name of the search engine
 * @param {string} category - Search category
 * @returns {Array<SearchResult>} - Parsed search results
 */
function parseSearchResults(data, engineName, category) {
	const results = [];

	try {
		if (engineName === 'DuckDuckGo') {
			results.push(...parseDuckDuckGoResults(data));
		}
	} catch (error) {
		console.error(`Error parsing ${engineName} results:`, error);
	}

	return results;
}


/**
 * Parse DuckDuckGo search results
 * @param {Object} data - DuckDuckGo response data
 * @returns {Array<SearchResult>}
 */
function parseDuckDuckGoResults(data) {
	const results = [];
	
	// DuckDuckGo instant answers
	if (data.AbstractText) {
		results.push(new SearchResult({
			title: data.Heading || 'DuckDuckGo Answer',
			url: data.AbstractURL || '',
			description: data.AbstractText || '',
			engine: 'DuckDuckGo',
			category: 'general'
		}));
	}

	// Related topics
	if (data.RelatedTopics && Array.isArray(data.RelatedTopics)) {
		data.RelatedTopics.forEach(item => {
			if (item.FirstURL && item.Text) {
				results.push(new SearchResult({
					title: item.Text.split(' - ')[0] || '',
					url: item.FirstURL || '',
					description: item.Text || '',
					engine: 'DuckDuckGo',
					category: 'general'
				}));
			}
		});
	}

	return results;
}



/**
 * Get available search engines
 * @returns {Array<Object>} - List of available search engines
 */
export function getAvailableEngines() {
	return Object.entries(SEARCH_ENGINES)
		.filter(([key, config]) => config.enabled)
		.map(([key, config]) => ({
			key,
			name: config.name,
			privacy: config.privacy
		}));
}

/**
 * Format search result URL for display
 * @param {string} url - Full URL
 * @returns {string} - Formatted URL
 */
export function formatUrl(url) {
	try {
		const urlObj = new URL(url);
		return urlObj.hostname + urlObj.pathname;
	} catch {
		return url;
	}
}

/**
 * Get favicon URL for a domain
 * @param {string} url - Full URL
 * @returns {string} - Favicon URL
 */
export function getFaviconUrl(url) {
	try {
		const urlObj = new URL(url);
		return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=32`;
	} catch {
		return '';
	}
}
