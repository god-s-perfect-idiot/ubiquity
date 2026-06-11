/** Shared helpers for Project Gutenberg books via Gutendex. */

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
