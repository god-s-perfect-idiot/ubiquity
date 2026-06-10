/**
 * Persists per-type cursors so discovery scripts don't re-scan the same
 * candidates on every run. State is stored in scripts/.discovery-state.json
 * (gitignored).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STATE_PATH = path.join(__dirname, '..', '.discovery-state.json');

const DEFAULT_STATE = {
	apps: { source: 0, offsets: {} },
	music: { termIndex: 0, genreIndex: 0 },
	video: { termIndex: 0, pages: {} },
	photo: { termIndex: 0, offsets: {} },
	document: { termIndex: 0, offsets: {} }
};

export function loadDiscoveryState() {
	try {
		if (fs.existsSync(STATE_PATH)) {
			return { ...structuredClone(DEFAULT_STATE), ...JSON.parse(fs.readFileSync(STATE_PATH, 'utf8')) };
		}
	} catch {
		// corrupt file — start fresh
	}
	return structuredClone(DEFAULT_STATE);
}

export function saveDiscoveryState(state) {
	fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
}

/** Pick the next `count` terms from a pool, advancing the saved cursor. */
export function rotateTerms(state, typeKey, pool, count) {
	const slot = state[typeKey] || (state[typeKey] = { termIndex: 0 });
	const start = (slot.termIndex || 0) % pool.length;
	const picked = [];
	for (let i = 0; i < count; i++) {
		picked.push(pool[(start + i) % pool.length]);
	}
	slot.termIndex = (start + count) % Math.max(pool.length, 1);
	return picked;
}

export function getOffset(state, typeKey, key) {
	const slot = state[typeKey] || (state[typeKey] = {});
	if (!slot.offsets) slot.offsets = {};
	return slot.offsets[key] || 0;
}

export function advanceOffset(state, typeKey, key, by, poolSize = Infinity) {
	const slot = state[typeKey] || (state[typeKey] = {});
	if (!slot.offsets) slot.offsets = {};
	const next = (slot.offsets[key] || 0) + by;
	slot.offsets[key] = poolSize === Infinity ? next : next % poolSize;
}

export function rotateIndex(state, typeKey, indexKey, poolLength) {
	const slot = state[typeKey] || (state[typeKey] = {});
	const current = slot[indexKey] || 0;
	const picked = current % poolLength;
	slot[indexKey] = (current + 1) % poolLength;
	return picked;
}

export const MUSIC_TERMS = [
	'indie rock', 'hip hop', 'synthwave', 'ambient', 'folk', 'metal', 'punk', 'soul',
	'reggae', 'blues', 'country', 'k-pop', 'latin pop', 'afrobeats', 'disco', 'grunge',
	'post punk', 'shoegaze', 'trip hop', 'drum and bass', 'house music', 'techno',
	'classical piano', 'opera', 'jazz fusion', 'bossa nova', 'celtic', 'world music',
	'new wave', 'garage rock', 'emo', 'trap', 'lofi beats', 'chillhop', 'acoustic covers'
];

/** iTunes RSS genre ids (subset of the public chart feeds). */
export const ITUNES_GENRES = [
	null, 11, 7, 6, 5, 9, 4, 3, 12, 13, 14, 2, 8, 10, 1
];

export const VIDEO_QUERIES = [
	'public domain film', 'nasa', 'classic cartoon', 'documentary', 'silent film',
	'educational film', 'prelinger', 'world war footage', 'nature documentary',
	'science film', 'travelogue', 'animation', 'newsreel', 'home movie', 'industrial film',
	'government film', 'sports archive', 'concert recording', 'opera recording', 'short film'
];

export const PHOTO_TERMS = [
	'mountain landscape', 'ocean sunset', 'forest path', 'city skyline', 'wildlife',
	'aurora borealis', 'desert dunes', 'waterfall', 'glacier', 'tropical beach',
	'cherry blossom', 'autumn leaves', 'starry night sky', 'coral reef', 'volcano',
	'rice terrace', 'medieval architecture', 'street photography', 'macro flower', 'snow landscape',
	'canyon', 'lighthouse', 'northern lights', 'safari animals', 'rainforest'
];

export const DOCUMENT_TERMS = [
	'science', 'history', 'philosophy', 'fiction', 'poetry', 'technology',
	'mathematics', 'psychology', 'economics', 'biology', 'physics', 'art history',
	'political science', 'sociology', 'mythology', 'travel', 'cooking', 'architecture',
	'music theory', 'linguistics', 'astronomy', 'geography', 'law', 'medicine', 'engineering'
];
