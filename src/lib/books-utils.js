/** Shared helpers for Project Gutenberg books via Gutendex. */

const FETCH_HEADERS = { 'User-Agent': 'Ubiquity/1.0 (https://ubiquity-1.netlify.app)' };
const GUTENDEX_TIMEOUT_MS = 8000;
const OPEN_LIBRARY_PAGE_SIZE = 32;

export async function fetchWithTimeout(url, options = {}, timeoutMs = GUTENDEX_TIMEOUT_MS) {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), timeoutMs);

	try {
		return await fetch(url, {
			...options,
			signal: controller.signal,
			headers: { ...FETCH_HEADERS, ...options.headers }
		});
	} finally {
		clearTimeout(timer);
	}
}

export function extractGutenbergIdFromIa(ia = []) {
	for (const identifier of ia) {
		let match = identifier.match(/(\d+)gut\b/i);
		if (match) return parseInt(match[1], 10);
		match = identifier.match(/\bpg(\d+)\b/i);
		if (match) return parseInt(match[1], 10);
		match = identifier.match(/ebooks[/_-](\d+)/i);
		if (match) return parseInt(match[1], 10);
	}
	return null;
}

export function mapOpenLibraryDoc(doc) {
	const id = extractGutenbergIdFromIa(doc.ia);
	if (!id) return null;

	return {
		id,
		title: doc.title,
		authors: (doc.author_name || []).map((name) => ({ name }))
	};
}

export async function searchGutendex(query, page = 1) {
	const api = `https://gutendex.com/books/?search=${encodeURIComponent(query)}&page=${page}`;
	const resp = await fetchWithTimeout(api);

	if (!resp.ok) {
		throw new Error(`Gutendex returned ${resp.status}`);
	}

	return resp.json();
}

export async function searchOpenLibrary(query, page = 1) {
	const offset = (page - 1) * OPEN_LIBRARY_PAGE_SIZE;
	const api =
		`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}` +
		`&limit=${OPEN_LIBRARY_PAGE_SIZE}&offset=${offset}` +
		'&has_fulltext=true&fields=key,title,author_name,ia';
	const resp = await fetchWithTimeout(api, {}, 10000);

	if (!resp.ok) {
		throw new Error(`Open Library returned ${resp.status}`);
	}

	const data = await resp.json();
	const seen = new Set();
	const results = [];

	for (const doc of data.docs || []) {
		const book = mapOpenLibraryDoc(doc);
		if (book && !seen.has(book.id)) {
			seen.add(book.id);
			results.push(book);
		}
	}

	const total = data.numFound ?? data.num_found ?? results.length;

	return {
		count: total,
		next: offset + OPEN_LIBRARY_PAGE_SIZE < total ? String(page + 1) : null,
		previous: page > 1 ? String(page - 1) : null,
		results
	};
}

export function gutenbergTextUrl(id) {
	return `https://www.gutenberg.org/cache/epub/${id}/pg${id}.txt`;
}

export function gutenbergFallbackBook(id) {
	const numericId = parseInt(id, 10);

	return {
		id: numericId,
		title: `Gutenberg #${numericId}`,
		authors: [],
		formats: {
			'text/plain; charset=utf-8': gutenbergTextUrl(numericId)
		}
	};
}

export function pickTextUrl(formats) {
	if (!formats) return null;

	const priorities = [
		'text/plain; charset=utf-8',
		'text/plain; charset=us-ascii',
		'text/plain',
		'text/html; charset=utf-8',
		'text/html'
	];

	for (const key of priorities) {
		if (formats[key]) return formats[key];
	}

	for (const [key, url] of Object.entries(formats)) {
		if (key.startsWith('text/plain') || key.startsWith('text/html')) return url;
	}

	return null;
}

export function stripGutenbergBoilerplate(text) {
	const startMarkers = [
		/\*\*\* START OF (THE |THIS )?PROJECT GUTENBERG/i,
		/\*\*\*START OF (THE |THIS )?PROJECT GUTENBERG/i
	];
	const endMarkers = [
		/\*\*\* END OF (THE |THIS )?PROJECT GUTENBERG/i,
		/\*\*\*END OF (THE |THIS )?PROJECT GUTENBERG/i
	];

	let start = 0;
	for (const marker of startMarkers) {
		const match = text.match(marker);
		if (match) {
			const lineEnd = text.indexOf('\n', match.index);
			start = lineEnd !== -1 ? lineEnd + 1 : match.index + match[0].length;
			break;
		}
	}

	let end = text.length;
	for (const marker of endMarkers) {
		const match = text.slice(start).match(marker);
		if (match) {
			end = start + match.index;
			break;
		}
	}

	return text.slice(start, end).trim();
}

export function paginateText(text, wordsPerPage = 250) {
	const words = text.split(/\s+/).filter(Boolean);
	const pages = [];

	for (let i = 0; i < words.length; i += wordsPerPage) {
		pages.push(words.slice(i, i + wordsPerPage).join(' '));
	}

	return pages.length ? pages : [''];
}

export function getGutenbergCoverUrl(id) {
	return `https://www.gutenberg.org/cache/epub/${id}/pg${id}.cover.medium.jpg`;
}

export function getGutenbergUrl(id) {
	return `https://www.gutenberg.org/ebooks/${id}`;
}

export function parseGutenbergId(content) {
	if (!content) return null;
	const match = content.match(/gutenberg\.org\/ebooks\/(\d+)/);
	return match ? parseInt(match[1], 10) : null;
}
