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

const MARKETPLACE_COLLECTION = 'marketplace';

// Marketplace item schema
export const MARKETPLACE_ITEM_SCHEMA = {
	type: 'string', // 'app', 'music', 'photo', 'video', 'document'
	name: 'string',
	description: 'string',
	owner: 'string', // user who published it
	ownerId: 'string', // user ID
	source: 'string', // URL or file path
	icon: 'string', // icon URL
	background: 'string', // background color
	category: 'string', // subcategory within type
	tags: 'array', // search tags
	downloads: 'number', // download count
	rating: 'number', // average rating
	ratingCount: 'number', // number of ratings
	size: 'number', // file size in bytes
	version: 'string', // version number
	isPublic: 'boolean', // whether item is publicly visible
	isFeatured: 'boolean', // whether item is featured
	createdAt: 'timestamp',
	updatedAt: 'timestamp'
};

/**
 * Add a new item to the marketplace
 * @param {Object} itemData - The item data to add
 * @returns {Promise<string>} - The document ID of the created item
 */
export async function addMarketplaceItem(itemData) {
	try {
		const docRef = await addDoc(collection(db, MARKETPLACE_COLLECTION), {
			...itemData,
			downloads: 0,
			rating: 0,
			ratingCount: 0,
			isPublic: true,
			isFeatured: false,
			createdAt: serverTimestamp(),
			updatedAt: serverTimestamp()
		});
		return docRef.id;
	} catch (error) {
		console.error('Error adding marketplace item:', error);
		throw error;
	}
}

/**
 * Get all marketplace items
 * @param {Object} options - Query options
 * @returns {Promise<Array>} - Array of marketplace items
 */
export async function getMarketplaceItems(options = {}) {
	try {
		const {
			type = null,
			category = null,
			limitCount = 50,
			orderByField = 'createdAt',
			orderDirection = 'desc',
			featured = null,
			isPublic = true
		} = options;

		// Get all items and filter in memory to avoid compound index issues
		const querySnapshot = await getDocs(collection(db, MARKETPLACE_COLLECTION));
		let items = [];
		
		querySnapshot.forEach((doc) => {
			const data = doc.data();
			items.push({
				id: doc.id,
				...data
			});
		});

		// Apply filters in memory
		if (type) {
			items = items.filter(item => item.type === type);
		}
		if (category) {
			items = items.filter(item => item.category === category);
		}
		if (featured !== null) {
			items = items.filter(item => item.isFeatured === featured);
		}
		if (isPublic !== null) {
			items = items.filter(item => item.isPublic === isPublic);
		}

		// Sort items
		items.sort((a, b) => {
			const aValue = a[orderByField] || 0;
			const bValue = b[orderByField] || 0;
			return orderDirection === 'desc' 
				? (bValue > aValue ? 1 : -1) 
				: (aValue > bValue ? 1 : -1);
		});

		// Apply limit
		items = items.slice(0, limitCount);

		return items;
	} catch (error) {
		console.error('Error getting marketplace items:', error);
		throw error;
	}
}

/**
 * Get a specific marketplace item by ID
 * @param {string} itemId - The item ID
 * @returns {Promise<Object|null>} - The marketplace item or null if not found
 */
export async function getMarketplaceItem(itemId) {
	try {
		const docRef = doc(db, MARKETPLACE_COLLECTION, itemId);
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
		console.error('Error getting marketplace item:', error);
		throw error;
	}
}

/**
 * Update a marketplace item
 * @param {string} itemId - The item ID
 * @param {Object} updateData - The data to update
 * @returns {Promise<void>}
 */
export async function updateMarketplaceItem(itemId, updateData) {
	try {
		const docRef = doc(db, MARKETPLACE_COLLECTION, itemId);
		await updateDoc(docRef, {
			...updateData,
			updatedAt: serverTimestamp()
		});
	} catch (error) {
		console.error('Error updating marketplace item:', error);
		throw error;
	}
}

/**
 * Delete a marketplace item
 * @param {string} itemId - The item ID
 * @returns {Promise<void>}
 */
export async function deleteMarketplaceItem(itemId) {
	try {
		const docRef = doc(db, MARKETPLACE_COLLECTION, itemId);
		await deleteDoc(docRef);
	} catch (error) {
		console.error('Error deleting marketplace item:', error);
		throw error;
	}
}

/**
 * Search marketplace items
 * @param {string} searchQuery - The search query
 * @param {Object} options - Search options
 * @returns {Promise<Array>} - Array of matching items
 */
export async function searchMarketplaceItems(searchQuery, options = {}) {
	try {
		const {
			type = null,
			limitCount = 50
		} = options;

		// Get all items and filter by search query
		// Note: For better performance, consider using Algolia or similar search service
		let q = collection(db, MARKETPLACE_COLLECTION);
		
		if (type) {
			q = query(q, where('type', '==', type));
		}

		const querySnapshot = await getDocs(q);
		const items = [];
		
		querySnapshot.forEach((doc) => {
			const data = doc.data();
			const searchLower = searchQuery.toLowerCase();
			
			// Search in name, description, and tags
			if (
				data.name.toLowerCase().includes(searchLower) ||
				data.description.toLowerCase().includes(searchLower) ||
				(data.tags && data.tags.some(tag => tag.toLowerCase().includes(searchLower)))
			) {
				items.push({
					id: doc.id,
					...data
				});
			}
		});

		// Sort by relevance (items with name matches first)
		items.sort((a, b) => {
			const aNameMatch = a.name.toLowerCase().includes(searchQuery.toLowerCase());
			const bNameMatch = b.name.toLowerCase().includes(searchQuery.toLowerCase());
			
			if (aNameMatch && !bNameMatch) return -1;
			if (!aNameMatch && bNameMatch) return 1;
			return 0;
		});

		return items.slice(0, limitCount);
	} catch (error) {
		console.error('Error searching marketplace items:', error);
		throw error;
	}
}

/**
 * Get items by owner
 * @param {string} ownerId - The owner ID
 * @returns {Promise<Array>} - Array of items owned by the user
 */
export async function getMarketplaceItemsByOwner(ownerId) {
	try {
		const q = query(
			collection(db, MARKETPLACE_COLLECTION),
			where('ownerId', '==', ownerId),
			orderBy('createdAt', 'desc')
		);

		const querySnapshot = await getDocs(q);
		const items = [];
		querySnapshot.forEach((doc) => {
			items.push({
				id: doc.id,
				...doc.data()
			});
		});

		return items;
	} catch (error) {
		console.error('Error getting marketplace items by owner:', error);
		throw error;
	}
}

/**
 * Increment download count for an item
 * @param {string} itemId - The item ID
 * @returns {Promise<void>}
 */
export async function incrementDownloadCount(itemId) {
	try {
		const item = await getMarketplaceItem(itemId);
		if (item) {
			await updateMarketplaceItem(itemId, {
				downloads: (item.downloads || 0) + 1
			});
		}
	} catch (error) {
		console.error('Error incrementing download count:', error);
		throw error;
	}
}

/**
 * Rate an item
 * @param {string} itemId - The item ID
 * @param {number} rating - The rating (1-5)
 * @returns {Promise<void>}
 */
export async function rateMarketplaceItem(itemId, rating) {
	try {
		const item = await getMarketplaceItem(itemId);
		if (item) {
			const currentRating = item.rating || 0;
			const currentCount = item.ratingCount || 0;
			
			const newCount = currentCount + 1;
			const newRating = ((currentRating * currentCount) + rating) / newCount;

			await updateMarketplaceItem(itemId, {
				rating: newRating,
				ratingCount: newCount
			});
		}
	} catch (error) {
		console.error('Error rating marketplace item:', error);
		throw error;
	}
}
