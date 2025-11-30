import { 
	collection, 
	doc, 
	getDocs, 
	getDoc, 
	addDoc, 
	updateDoc, 
	deleteDoc, 
	query, 
	where, 
	orderBy,
	serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase-config.js';

const LIVETILES_COLLECTION = 'livetiles';

// Live tile schema
export const LIVETILE_SCHEMA = {
	appUrl: 'string', // URL of the app this tile is for
	appName: 'string', // Name of the app
	tile4x2: 'string', // HTML for 4x2 tile
	tile2x2: 'string', // HTML for 2x2 tile
	autoTileFlip: 'boolean', // Whether auto flip is enabled
	owner: 'string', // User who published it
	ownerId: 'string', // User ID
	description: 'string', // Optional description
	downloads: 'number', // Download/use count
	rating: 'number', // Average rating
	ratingCount: 'number', // Number of ratings
	isPublic: 'boolean', // Whether tile is publicly visible
	createdAt: 'timestamp',
	updatedAt: 'timestamp'
};

/**
 * Add a new live tile to Firestore
 * @param {Object} tileData - The live tile data to add
 * @returns {Promise<string>} - The document ID of the created tile
 */
export async function addLiveTile(tileData) {
	try {
		// Normalize URL before storing
		const normalizedTileData = {
			...tileData,
			appUrl: normalizeUrl(tileData.appUrl || '')
		};
		
		const docRef = await addDoc(collection(db, LIVETILES_COLLECTION), {
			...normalizedTileData,
			downloads: 0,
			rating: 0,
			ratingCount: 0,
			isPublic: true,
			createdAt: serverTimestamp(),
			updatedAt: serverTimestamp()
		});
		return docRef.id;
	} catch (error) {
		console.error('Error adding live tile:', error);
		throw error;
	}
}

/**
 * Get live tiles by app URL
 * @param {string} appUrl - The app URL to query by
 * @param {Object} options - Query options
 * @returns {Promise<Array>} - Array of live tiles for the URL
 */
export async function getLiveTilesByUrl(appUrl, options = {}) {
	try {
		const {
			limitCount = 50,
			orderByField = 'createdAt',
			orderDirection = 'desc',
			isPublic = true
		} = options;

		// Query by URL - normalize URL for better matching
		const normalizedUrl = normalizeUrl(appUrl);
		
		// Get all tiles and filter by URL in memory to avoid index issues
		const querySnapshot = await getDocs(collection(db, LIVETILES_COLLECTION));
		let tiles = [];
		
		querySnapshot.forEach((doc) => {
			const data = doc.data();
			// Normalize stored URL for comparison
			const storedUrl = normalizeUrl(data.appUrl || '');
			
			if (storedUrl === normalizedUrl) {
				tiles.push({
					id: doc.id,
					...data
				});
			}
		});

		// Filter by isPublic if specified
		if (isPublic !== null) {
			tiles = tiles.filter(tile => tile.isPublic === isPublic);
		}

		// Sort tiles
		tiles.sort((a, b) => {
			const aValue = a[orderByField] || 0;
			const bValue = b[orderByField] || 0;
			return orderDirection === 'desc' 
				? (bValue > aValue ? 1 : -1) 
				: (aValue > bValue ? 1 : -1);
		});

		// Apply limit
		tiles = tiles.slice(0, limitCount);

		return tiles;
	} catch (error) {
		console.error('Error getting live tiles by URL:', error);
		throw error;
	}
}

/**
 * Get all live tiles
 * @param {Object} options - Query options
 * @returns {Promise<Array>} - Array of live tiles
 */
export async function getAllLiveTiles(options = {}) {
	try {
		const {
			limitCount = 50,
			orderByField = 'createdAt',
			orderDirection = 'desc',
			isPublic = true
		} = options;

		// Get all tiles
		const querySnapshot = await getDocs(collection(db, LIVETILES_COLLECTION));
		let tiles = [];
		
		querySnapshot.forEach((doc) => {
			const data = doc.data();
			tiles.push({
				id: doc.id,
				...data
			});
		});

		// Filter by isPublic if specified
		if (isPublic !== null) {
			tiles = tiles.filter(tile => tile.isPublic === isPublic);
		}

		// Sort tiles
		tiles.sort((a, b) => {
			const aValue = a[orderByField] || 0;
			const bValue = b[orderByField] || 0;
			return orderDirection === 'desc' 
				? (bValue > aValue ? 1 : -1) 
				: (aValue > bValue ? 1 : -1);
		});

		// Apply limit
		tiles = tiles.slice(0, limitCount);

		return tiles;
	} catch (error) {
		console.error('Error getting all live tiles:', error);
		throw error;
	}
}

/**
 * Get a specific live tile by ID
 * @param {string} tileId - The tile ID
 * @returns {Promise<Object|null>} - The live tile or null if not found
 */
export async function getLiveTile(tileId) {
	try {
		const docRef = doc(db, LIVETILES_COLLECTION, tileId);
		const docSnap = await getDoc(docRef);

		if (docSnap.exists()) {
			return {
				id: docSnap.id,
				...docSnap.data()
			};
		} else {
			return null;
		}
	} catch (error) {
		console.error('Error getting live tile:', error);
		throw error;
	}
}

/**
 * Update a live tile
 * @param {string} tileId - The tile ID
 * @param {Object} updateData - The data to update
 * @returns {Promise<void>}
 */
export async function updateLiveTile(tileId, updateData) {
	try {
		const docRef = doc(db, LIVETILES_COLLECTION, tileId);
		await updateDoc(docRef, {
			...updateData,
			updatedAt: serverTimestamp()
		});
	} catch (error) {
		console.error('Error updating live tile:', error);
		throw error;
	}
}

/**
 * Delete a live tile
 * @param {string} tileId - The tile ID
 * @returns {Promise<void>}
 */
export async function deleteLiveTile(tileId) {
	try {
		const docRef = doc(db, LIVETILES_COLLECTION, tileId);
		await deleteDoc(docRef);
	} catch (error) {
		console.error('Error deleting live tile:', error);
		throw error;
	}
}

/**
 * Increment download/use count for a live tile
 * @param {string} tileId - The tile ID
 * @returns {Promise<void>}
 */
export async function incrementDownloadCount(tileId) {
	try {
		const tile = await getLiveTile(tileId);
		if (tile) {
			await updateLiveTile(tileId, {
				downloads: (tile.downloads || 0) + 1
			});
		}
	} catch (error) {
		console.error('Error incrementing download count:', error);
		throw error;
	}
}

/**
 * Normalize URL for consistent comparison
 * Removes trailing slashes, normalizes protocol, and handles common variations
 */
function normalizeUrl(url) {
	if (!url) return '';
	
	// Convert to string and trim
	let normalized = String(url).trim();
	
	// Remove trailing slash(es)
	normalized = normalized.replace(/\/+$/, '');
	
	// Normalize protocol (ensure https:// or http://)
	if (!normalized.match(/^https?:\/\//)) {
		normalized = 'https://' + normalized;
	}
	
	// Remove www. prefix for consistency (optional - comment out if you want to keep www)
	normalized = normalized.replace(/^(https?:\/\/)www\./, '$1');
	
	// Convert to lowercase for case-insensitive comparison
	normalized = normalized.toLowerCase();
	
	return normalized;
}

