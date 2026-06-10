/**
 * Web discovery + enrichment helpers built on keyless public APIs.
 *
 *   Apps      -> Wikipedia "most popular websites" list + Microlink/favicon logos
 *   Music     -> iTunes Search API (30s preview streams + artwork)
 *   Videos    -> Internet Archive (public-domain movies + mp4 downloads)
 *   Photos    -> Wikimedia Commons image search
 *   Documents -> Open Library (book catalog + cover art + archive.org scans)
 *
 * None of these require an API key. Each function returns plain objects shaped
 * for the marketplace schema (name/description/source/icon/category/tags).
 */
import { validateThumbnail } from './images.js';
import { domainOf } from './marketplace.js';
import { sleep } from './cli.js';

const UA = 'UbiquityMarketplaceBot/1.0 (+https://github.com/)';

async function fetchJson(url, { timeoutMs = 15000 } = {}) {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), timeoutMs);
	try {
		const res = await fetch(url, {
			signal: controller.signal,
			headers: { 'User-Agent': UA, Accept: 'application/json' }
		});
		if (!res.ok) return null;
		return await res.json();
	} catch {
		return null;
	} finally {
		clearTimeout(timer);
	}
}

function stripHtml(html) {
	if (!html) return '';
	return html
		.replace(/<[^>]*>/g, ' ')
		.replace(/&[a-z]+;/gi, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

function truncate(text, max = 220) {
	if (!text) return '';
	return text.length > max ? `${text.slice(0, max - 1).trim()}…` : text;
}

/* -------------------------------------------------------------------------- */
/* Apps                                                                       */
/* -------------------------------------------------------------------------- */

export async function microlinkMeta(url) {
	const data = await fetchJson(`https://api.microlink.io/?url=${encodeURIComponent(url)}`);
	if (!data || data.status !== 'success' || !data.data) return null;
	return {
		title: data.data.title || '',
		description: data.data.description || '',
		logo: data.data.logo?.url || '',
		image: data.data.image?.url || ''
	};
}

/**
 * Resolve the best available high-quality logo/thumbnail for a website.
 * Tries several sources and returns the largest one that validates.
 */
export async function resolveAppThumbnail(url, { minSide = 128, meta = null, fast = false } = {}) {
	const domain = domainOf(url);
	const candidates = [];
	if (meta?.logo) candidates.push(meta.logo);
	if (meta?.image) candidates.push(meta.image);
	if (domain) {
		candidates.push(`https://logo.clearbit.com/${domain}?size=256`);
		if (!fast) candidates.push(`https://icon.horse/icon/${domain}`);
		candidates.push(`https://www.google.com/s2/favicons?domain=${domain}&sz=256`);
	}

	let best = null;
	for (const candidate of candidates) {
		if (!candidate) continue;
		const v = await validateThumbnail(candidate, {
			minSide,
			timeoutMs: fast ? 5000 : 12000
		});
		if (v.ok && v.hq) {
			return { url: candidate, validation: v };
		}
		if (v.ok && (!best || (v.width || 0) > (best.validation.width || 0))) {
			best = { url: candidate, validation: v };
		}
		// Fast mode: stop after first working image even if low-res.
		if (fast && v.ok) return { url: candidate, validation: v };
	}
	return best;
}

const APP_WIKI_LISTS = [
	'List_of_most-visited_websites',
	'List_of_social_networking_websites',
	'List_of_online_databases',
	'List_of_collaboration_software',
	'List_of_project_management_software',
	'List_of_note-taking_software'
];

const APP_WIKI_CATEGORIES = [
	'Category:Web_applications',
	'Category:Project_management_software',
	'Category:Note-taking_software',
	'Category:Online_music_databases',
	'Category:Internet_search_engines'
];

function parseWikipediaDomainRows(wikitext, { limit, offset = 0 }) {
	const seen = new Set();
	const out = [];
	const rows = wikitext.split('|-');
	const domainRe = /\b((?:[a-z0-9-]+\.)+[a-z]{2,})\b/i;

	for (const row of rows) {
		const cells = row
			.split('\n')
			.map((l) => l.trim())
			.filter((l) => l.startsWith('|') && !l.startsWith('|+') && !l.startsWith('|-'));
		if (!cells.length) continue;

		const text = row.replace(/\{\{[^}]*\}\}/g, ' ');
		const domainMatch = text.match(domainRe);
		if (!domainMatch) continue;
		const domain = domainMatch[1].toLowerCase().replace(/^www\./, '');
		if (seen.has(domain)) continue;
		seen.add(domain);

		const nameCell = cells[0].replace(/^\|\s*/, '');
		let name = nameCell
			.replace(/\[\[([^\]|]*\|)?([^\]]*)\]\]/g, '$2')
			.replace(/'''/g, '')
			.replace(/<[^>]*>/g, '')
			.trim();
		if (!name || /^https?:/i.test(name) || name.includes('.')) {
			name = domain.split('.')[0];
		}
		name = name.charAt(0).toUpperCase() + name.slice(1);
		out.push({ name, domain, url: `https://${domain}` });
	}

	return out.slice(offset, offset + limit);
}

/** Scrape a Wikipedia list page for website domains. */
export async function discoverWikipediaList(pageTitle, { limit = 50, offset = 0 } = {}) {
	const api =
		`https://en.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(pageTitle)}` +
		'&redirects=1&prop=wikitext&format=json&formatversion=2&origin=*';
	const data = await fetchJson(api);
	const wikitext = data?.parse?.wikitext;
	if (!wikitext) return [];
	return parseWikipediaDomainRows(wikitext, { limit, offset });
}

/** Scrape Wikipedia's "List of most popular websites" via the MediaWiki API. */
export async function discoverPopularWebsites(opts = {}) {
	return discoverWikipediaList('List_of_most-visited_websites', opts);
}

/** Pull page titles from a Wikipedia category and map to likely web URLs. */
export async function discoverWikipediaCategory(categoryTitle, { limit = 50, offset = 0 } = {}) {
	const api =
		'https://en.wikipedia.org/w/api.php?action=query&list=categorymembers' +
		`&cmtitle=${encodeURIComponent(categoryTitle)}` +
		`&cmlimit=${Math.min(limit + offset, 500)}&cmtype=page&format=json&formatversion=2&origin=*`;
	const data = await fetchJson(api);
	const members = data?.query?.categorymembers || [];
	const slice = members.slice(offset, offset + limit);
	const out = [];

	for (const m of slice) {
		const title = m.title || '';
		if (!title || title.includes('List of') || title.includes('Category:')) continue;
		const slug = title.replace(/\s+/g, '').toLowerCase();
		const domain = `${slug}.com`;
		out.push({
			name: title,
			domain,
			url: `https://www.${domain}`
		});
	}
	return out;
}

/** Rotate through Wikipedia lists + categories for fresh app candidates. */
export async function discoverAppsRotating(state, { batchSize = 40 } = {}) {
	const slot = state.apps || (state.apps = { source: 0, offsets: {} });
	const sources = [
		...APP_WIKI_LISTS.map((page) => ({ kind: 'list', key: page, page })),
		...APP_WIKI_CATEGORIES.map((cat) => ({ kind: 'category', key: cat, cat }))
	];
	const sourceIdx = slot.source % sources.length;
	const source = sources[sourceIdx];
	const offset = slot.offsets[source.key] || 0;
	slot.source = (sourceIdx + 1) % sources.length;

	let candidates = [];
	if (source.kind === 'list') {
		candidates = await discoverWikipediaList(source.page, { limit: batchSize, offset });
	} else {
		candidates = await discoverWikipediaCategory(source.cat, { limit: batchSize, offset });
	}

	slot.offsets[source.key] = offset + batchSize;
	return { candidates, source: source.key, offset };
}

/* -------------------------------------------------------------------------- */
/* Music (iTunes Search API)                                                  */
/* -------------------------------------------------------------------------- */

function itunesTrackToRecord(r, label = '') {
	if (!r.previewUrl) return null;
	const artwork = (r.artworkUrl100 || r.artworkUrl60 || '').replace(
		/\/\d+x\d+bb\.(jpg|png)/,
		'/600x600bb.$1'
	);
	return {
		type: 'music',
		name: r.trackName,
		description: truncate(`${r.trackName} by ${r.artistName} — ${r.collectionName || ''}`),
		source: r.previewUrl,
		icon: artwork,
		background: '#1DB954',
		category: (r.primaryGenreName || 'music').toLowerCase(),
		tags: [r.artistName, r.primaryGenreName, label].filter(Boolean).map((t) => String(t).toLowerCase())
	};
}

export async function discoverMusic({ term, limit = 25 } = {}) {
	const api = `https://itunes.apple.com/search?term=${encodeURIComponent(
		term
	)}&media=music&entity=song&limit=${Math.min(limit, 200)}`;
	const data = await fetchJson(api);
	if (!data?.results) return [];
	const out = [];
	for (const r of data.results) {
		const record = itunesTrackToRecord(r, term);
		if (record) out.push(record);
	}
	return out;
}

/** iTunes RSS top-songs charts — different results each genre / overall. */
export async function discoverMusicCharts({ genreId = null, limit = 50 } = {}) {
	const path = genreId
		? `topsongs/limit=${limit}/genre=${genreId}/json`
		: `topsongs/limit=${limit}/json`;
	const data = await fetchJson(`https://itunes.apple.com/us/rss/${path}`);
	const entries = data?.feed?.entry;
	if (!entries) return [];
	const list = Array.isArray(entries) ? entries : [entries];
	const out = [];

	for (const entry of list) {
		const trackId = entry?.id?.attributes?.['im:id'];
		if (!trackId) continue;
		const lookup = await fetchJson(
			`https://itunes.apple.com/lookup?id=${trackId}&entity=song`
		);
		const r = lookup?.results?.[0];
		const record = itunesTrackToRecord(r, genreId ? `genre-${genreId}` : 'chart');
		if (record) out.push(record);
		await sleep(80);
	}
	return out;
}

/* -------------------------------------------------------------------------- */
/* Videos (Internet Archive)                                                  */
/* -------------------------------------------------------------------------- */

export async function discoverVideos({ query = 'public domain film', limit = 10, page = 1 } = {}) {
	const search =
		`https://archive.org/advancedsearch.php?q=${encodeURIComponent(
			`(${query}) AND mediatype:movies AND format:(MPEG4)`
		)}` +
		'&fl[]=identifier&fl[]=title&fl[]=description&fl[]=year&rows=' +
		limit +
		`&page=${page}&output=json`;
	const data = await fetchJson(search);
	const docs = data?.response?.docs || [];
	const out = [];

	for (const d of docs) {
		const meta = await fetchJson(`https://archive.org/metadata/${d.identifier}`);
		if (!meta?.files) {
			await sleep(150);
			continue;
		}
		const mp4 = meta.files.find(
			(f) => typeof f.name === 'string' && /\.mp4$/i.test(f.name) && f.source !== 'metadata'
		);
		if (!mp4) {
			await sleep(150);
			continue;
		}
		out.push({
			type: 'video',
			name: d.title || d.identifier,
			description: truncate(stripHtml(Array.isArray(d.description) ? d.description[0] : d.description)),
			source: `https://archive.org/download/${d.identifier}/${encodeURIComponent(mp4.name)}`,
			icon: `https://archive.org/services/img/${d.identifier}`,
			background: '#000000',
			category: 'film',
			tags: ['video', 'archive.org', d.year].filter(Boolean).map((t) => String(t).toLowerCase())
		});
		await sleep(150);
	}
	return out;
}

/* -------------------------------------------------------------------------- */
/* Photos (Wikimedia Commons)                                                 */
/* -------------------------------------------------------------------------- */

export async function discoverPhotos({ term, limit = 20, offset = 0 } = {}) {
	const api =
		'https://commons.wikimedia.org/w/api.php?action=query&generator=search' +
		`&gsrsearch=${encodeURIComponent(`filetype:bitmap ${term}`)}` +
		`&gsrnamespace=6&gsrlimit=${limit}&gsroffset=${offset}` +
		'&prop=imageinfo&iiprop=url|extmetadata' +
		'&iiurlwidth=800&format=json&formatversion=2&origin=*';
	const data = await fetchJson(api);
	const pages = data?.query?.pages || [];
	const out = [];

	for (const page of pages) {
		const info = page.imageinfo?.[0];
		if (!info?.url) continue;
		if (!/\.(jpe?g|png|webp)$/i.test(info.url)) continue;
		const name = page.title.replace(/^File:/, '').replace(/\.[a-z0-9]+$/i, '').replace(/_/g, ' ');
		const desc = stripHtml(info.extmetadata?.ImageDescription?.value || '');
		out.push({
			type: 'image',
			name,
			description: truncate(desc || `${name} — via Wikimedia Commons`),
			source: info.url,
			icon: info.thumburl || info.url,
			background: '#222222',
			category: 'photography',
			tags: [term, 'wikimedia', 'photo'].map((t) => t.toLowerCase())
		});
	}
	return out;
}

/* -------------------------------------------------------------------------- */
/* Documents (Open Library)                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Resolve the best replacement thumbnail for an existing marketplace item.
 * Uses type-aware strategies before falling back to Microlink og:image.
 */
export async function resolveItemThumbnail(item, { minSide = 128 } = {}) {
	const tryUrl = async (url) => {
		if (!url) return null;
		const v = await validateThumbnail(url, { minSide });
		return v.ok ? url : null;
	};

	switch (item.type) {
		case 'app': {
			const meta = await microlinkMeta(item.source).catch(() => null);
			const result = await resolveAppThumbnail(item.source, { minSide, meta });
			return result?.url || null;
		}
		case 'music': {
			const results = await discoverMusic({ term: item.name, limit: 8 });
			const exact = results.find((r) => r.name.toLowerCase() === item.name.toLowerCase());
			const pick = exact || results[0];
			if (pick?.icon) {
				const url = await tryUrl(pick.icon);
				if (url) return url;
			}
			break;
		}
		case 'video': {
			const idMatch = item.source.match(/archive\.org\/(?:download|details)\/([^/?#]+)/i);
			if (idMatch) {
				const url = await tryUrl(`https://archive.org/services/img/${idMatch[1]}`);
				if (url) return url;
			}
			break;
		}
		case 'image': {
			const url = await tryUrl(item.source);
			if (url) return url;
			break;
		}
		case 'document': {
			const coverMatch = item.icon?.match(/covers\.openlibrary\.org\/b\/id\/(\d+)/);
			if (coverMatch) {
				const url = await tryUrl(`https://covers.openlibrary.org/b/id/${coverMatch[1]}-L.jpg`);
				if (url) return url;
			}
			const results = await discoverDocuments({ term: item.name, limit: 5 });
			const exact = results.find((r) => r.name.toLowerCase() === item.name.toLowerCase());
			const pick = exact || results[0];
			if (pick?.icon) {
				const url = await tryUrl(pick.icon);
				if (url) return url;
			}
			break;
		}
	}

	const meta = await microlinkMeta(item.source).catch(() => null);
	const candidate = meta?.image || meta?.logo;
	return (await tryUrl(candidate)) || null;
}

export async function discoverDocuments({ term, limit = 20, offset = 0 } = {}) {
	const api =
		`https://openlibrary.org/search.json?q=${encodeURIComponent(term)}` +
		`&limit=${limit}&offset=${offset}` +
		'&fields=key,title,author_name,cover_i,ia,first_publish_year,subject';
	const data = await fetchJson(api, { timeoutMs: 25000 });
	const docs = data?.docs || [];
	const out = [];

	for (const book of docs) {
		if (!book.title) continue;
		const author = book.author_name?.[0] || 'Unknown author';
		// Prefer a readable Internet Archive scan, fall back to the Open Library work page.
		const source = book.ia?.length
			? `https://archive.org/details/${book.ia[0]}`
			: `https://openlibrary.org${book.key}`;
		const cover = book.cover_i ? `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg` : '';
		out.push({
			type: 'document',
			name: book.title,
			description: truncate(
				`${book.title} by ${author}${book.first_publish_year ? ` (${book.first_publish_year})` : ''}. ${(book.subject || []).slice(0, 3).join(', ')}`
			),
			source,
			icon: cover,
			background: '#8B4513',
			category: 'book',
			tags: [author, ...(book.subject || []).slice(0, 2), term].filter(Boolean).map((t) => t.toLowerCase())
		});
	}
	return out;
}
