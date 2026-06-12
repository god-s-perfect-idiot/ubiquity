// Search utilities for web and unified local search
import { RESULT_GROUPS, RESULT_ACTIONS, GROUP_ORDER, GROUP_LABELS } from './search-types.js';

/**
 * Search result structure
 */
export class SearchResult {
	constructor(data) {
		this.id = data.id || `web-${data.url || data.title}`;
		this.title = data.title || '';
		this.subtitle = data.subtitle || '';
		this.url = data.url || '';
		this.description = data.description || '';
		this.engine = data.engine || '';
		this.timestamp = data.timestamp || new Date();
		this.favicon = data.favicon || '';
		this.category = data.category || RESULT_GROUPS.WEB;
		this.type = data.type || RESULT_GROUPS.WEB;
		this.icon = data.icon || '';
		this.iconSrc = data.iconSrc || '';
		this.iconify = data.iconify || data.icon || '';
		this.bgClass = data.bgClass || '';
		this.bgStyle = data.bgStyle || '';
		this.initial = data.initial || '';
		this.overrideClass = data.overrideClass || '';
		this.rowOverrideClass = data.rowOverrideClass || '';
		this.contentOverrideClass = data.contentOverrideClass || '';
		this.action = data.action || RESULT_ACTIONS.OPEN_URL;
		this.score = data.score || 0;
		this.metadata = data.metadata || {};
	}
}

/**
 * Search engines configuration
 */
export const SEARCH_ENGINES = {
	AUTO: {
		name: 'Auto (best results)',
		enabled: true,
		privacy: 'high',
		usesProxy: true
	},
	DUCKDUCKGO: {
		name: 'DuckDuckGo',
		enabled: true,
		privacy: 'high',
		usesProxy: true
	},
	WIKIPEDIA: {
		name: 'Wikipedia',
		enabled: true,
		privacy: 'high',
		usesProxy: true
	}
};

/**
 * Get autocomplete suggestions from DuckDuckGo
 * @param {string} query
 * @returns {Promise<Array<string>>}
 */
export async function getSearchSuggestions(query) {
	if (!query || query.length < 2) return [];

	try {
		const response = await fetch(
			`https://duckduckgo.com/ac/?q=${encodeURIComponent(query)}&type=list`
		);
		const data = await response.json();
		if (Array.isArray(data) && Array.isArray(data[1])) {
			return data[1].slice(0, 8);
		}
		return [];
	} catch (error) {
		console.error('Error fetching suggestions:', error);
		return [];
	}
}

export const SEARCH_CATEGORIES = {
	GENERAL: 'general',
	IMAGES: 'images',
	NEWS: 'news',
	VIDEOS: 'videos',
	MAPS: 'maps',
	SHOPPING: 'shopping'
};

/**
 * Perform a web search via the server proxy
 * @param {string} query
 * @param {string} engine
 * @param {number} limit
 * @returns {Promise<Array<SearchResult>>}
 */
export async function performSearch(query, engine = 'AUTO', _category = 'general', _page = 0, limit = 10) {
	if (!query || query.trim().length === 0) {
		return [];
	}

	const resolvedEngine =
		SEARCH_ENGINES[engine]?.enabled ? engine : 'AUTO';

	const params = new URLSearchParams({
		q: query,
		engine: resolvedEngine,
		limit: String(limit)
	});

	const response = await fetch(`/api/search/web?${params}`);
	const data = await response.json();

	if (!response.ok && !data.results) {
		throw new Error(data.error || `HTTP ${response.status}`);
	}

	return (data.results || []).map(
		(item) =>
			new SearchResult({
				...item,
				type: RESULT_GROUPS.WEB,
				action: RESULT_ACTIONS.OPEN_URL,
				favicon: item.url ? getFaviconUrl(item.url) : ''
			})
	);
}

/**
 * Get available search engines
 * @returns {Array<Object>}
 */
export function getAvailableEngines() {
	return Object.entries(SEARCH_ENGINES)
		.filter(([, config]) => config.enabled)
		.map(([key, config]) => ({
			key,
			name: config.name,
			privacy: config.privacy
		}));
}

/**
 * Format search result URL for display
 * @param {string} url
 * @returns {string}
 */
export function formatUrl(url) {
	if (!url) return '';
	if (url.startsWith('/')) return url;

	try {
		const urlObj = new URL(url);
		return urlObj.hostname + urlObj.pathname;
	} catch {
		return url;
	}
}

/**
 * Get favicon URL for a domain
 * @param {string} url
 * @returns {string}
 */
export function getFaviconUrl(url) {
	try {
		const urlObj = new URL(url);
		return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=32`;
	} catch {
		return '';
	}
}

/**
 * Group flat results by type for Spotlight-style UI
 * @param {Array<Object>} results
 * @returns {Array<{ key: string, label: string, results: Array<Object> }>}
 */
export function groupResults(results) {
	const buckets = new Map();

	for (const result of results) {
		const key = result.type || result.category || RESULT_GROUPS.WEB;
		if (!buckets.has(key)) buckets.set(key, []);
		buckets.get(key).push(result);
	}

	return GROUP_ORDER.filter((key) => buckets.has(key)).map((key) => ({
		key,
		label: GROUP_LABELS[key] || key,
		results: buckets.get(key)
	}));
}
