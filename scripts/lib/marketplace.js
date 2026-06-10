import {
	getDb,
	MARKETPLACE_COLLECTION,
	collection,
	getDocs,
	addDoc,
	updateDoc,
	doc,
	serverTimestamp
} from './firebase.js';

export const PUBLISHER_BOT = 'App Finder Bot';
export const VALID_TYPES = ['app', 'music', 'image', 'video', 'document'];

/** Map plural category names used across the project to marketplace types. */
export const TYPE_BY_CATEGORY = {
	apps: 'app',
	music: 'music',
	videos: 'video',
	photos: 'image',
	images: 'image',
	documents: 'document',
	docs: 'document'
};

export function normalizeUrl(url) {
	if (!url || typeof url !== 'string') return '';
	try {
		const u = new URL(url.trim());
		const host = u.hostname.replace(/^www\./, '').toLowerCase();
		const path = u.pathname.replace(/\/+$/, '');
		return `${host}${path}`;
	} catch {
		return url.trim().toLowerCase();
	}
}

export function domainOf(url) {
	try {
		return new URL(url).hostname.replace(/^www\./, '').toLowerCase();
	} catch {
		return '';
	}
}

/** Load every marketplace item once so scripts can dedup and update in place. */
export async function loadMarketplace() {
	const db = getDb();
	const snapshot = await getDocs(collection(db, MARKETPLACE_COLLECTION));
	const items = [];
	snapshot.forEach((docSnap) => {
		items.push({ id: docSnap.id, ...docSnap.data() });
	});
	return items;
}

/** Build lookup sets for dedup by source URL, normalized URL and name. */
export function buildDedupIndex(items, type = null) {
	const scoped = type ? items.filter((i) => i.type === type) : items;
	const bySource = new Set();
	const byNormalized = new Set();
	const byName = new Set();
	for (const item of scoped) {
		if (item.source) {
			bySource.add(item.source);
			byNormalized.add(normalizeUrl(item.source));
		}
		if (item.name) byName.add(item.name.trim().toLowerCase());
	}
	return {
		has(candidate) {
			if (candidate.source && bySource.has(candidate.source)) return true;
			if (candidate.source && byNormalized.has(normalizeUrl(candidate.source))) return true;
			if (candidate.name && byName.has(candidate.name.trim().toLowerCase())) return true;
			return false;
		},
		add(candidate) {
			if (candidate.source) {
				bySource.add(candidate.source);
				byNormalized.add(normalizeUrl(candidate.source));
			}
			if (candidate.name) byName.add(candidate.name.trim().toLowerCase());
		}
	};
}

/**
 * Add a discovered item to the marketplace, attributed to the App Finder Bot.
 * @returns {Promise<string>} new document id
 */
export async function addDiscoveredItem(item) {
	const db = getDb();
	const docRef = await addDoc(collection(db, MARKETPLACE_COLLECTION), {
		type: item.type,
		name: item.name,
		description: item.description || '',
		owner: PUBLISHER_BOT,
		ownerId: 'app-finder-bot',
		source: item.source,
		icon: item.icon || '',
		background: item.background || '#ffffff',
		category: item.category || 'general',
		tags: item.tags && item.tags.length ? item.tags : [item.name.toLowerCase()],
		downloads: 0,
		rating: 0,
		ratingCount: 0,
		version: '1.0.0',
		isPublic: true,
		isFeatured: false,
		createdAt: serverTimestamp(),
		updatedAt: serverTimestamp()
	});
	return docRef.id;
}

/** Update just the icon (thumbnail) of an existing item. */
export async function updateItemIcon(itemId, iconUrl) {
	const db = getDb();
	await updateDoc(doc(db, MARKETPLACE_COLLECTION, itemId), {
		icon: iconUrl,
		updatedAt: serverTimestamp()
	});
}
