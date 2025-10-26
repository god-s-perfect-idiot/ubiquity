/**
 * Utility functions for marketplace operations
 */

/**
 * Fetch marketplace items from the API
 * @param {Object} options - Query options
 * @returns {Promise<Array>} - Array of marketplace items
 */
export async function fetchMarketplaceItems(options = {}) {
	try {
		const params = new URLSearchParams();
		
		if (options.type) params.append('type', options.type);
		if (options.category) params.append('category', options.category);
		if (options.search) params.append('search', options.search);
		if (options.featured !== null) params.append('featured', options.featured);
		if (options.limit) params.append('limit', options.limit);
		if (options.orderBy) params.append('orderBy', options.orderBy);
		if (options.orderDirection) params.append('orderDirection', options.orderDirection);

		const response = await fetch(`/api/marketplace?${params.toString()}`);
		const data = await response.json();

		if (!data.success) {
			throw new Error(data.error || 'Failed to fetch marketplace items');
		}

		return data.items;
	} catch (error) {
		console.error('Error fetching marketplace items:', error);
		throw error;
	}
}

/**
 * Add a new item to the marketplace
 * @param {Object} itemData - The item data
 * @returns {Promise<string>} - The item ID
 */
export async function addMarketplaceItem(itemData) {
	try {
		const response = await fetch('/api/marketplace', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(itemData)
		});

		const data = await response.json();

		if (!data.success) {
			throw new Error(data.error || 'Failed to add marketplace item');
		}

		return data.itemId;
	} catch (error) {
		console.error('Error adding marketplace item:', error);
		throw error;
	}
}

/**
 * Get a specific marketplace item
 * @param {string} itemId - The item ID
 * @returns {Promise<Object>} - The marketplace item
 */
export async function getMarketplaceItem(itemId) {
	try {
		const response = await fetch(`/api/marketplace/${itemId}`);
		const data = await response.json();

		if (!data.success) {
			throw new Error(data.error || 'Failed to get marketplace item');
		}

		return data.item;
	} catch (error) {
		console.error('Error getting marketplace item:', error);
		throw error;
	}
}

/**
 * Update a marketplace item
 * @param {string} itemId - The item ID
 * @param {Object} updateData - The update data
 * @returns {Promise<void>}
 */
export async function updateMarketplaceItem(itemId, updateData) {
	try {
		const response = await fetch(`/api/marketplace/${itemId}`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(updateData)
		});

		const data = await response.json();

		if (!data.success) {
			throw new Error(data.error || 'Failed to update marketplace item');
		}
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
		const response = await fetch(`/api/marketplace/${itemId}`, {
			method: 'DELETE'
		});

		const data = await response.json();

		if (!data.success) {
			throw new Error(data.error || 'Failed to delete marketplace item');
		}
	} catch (error) {
		console.error('Error deleting marketplace item:', error);
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
		const response = await fetch(`/api/marketplace/${itemId}/download`, {
			method: 'POST'
		});

		const data = await response.json();

		if (!data.success) {
			throw new Error(data.error || 'Failed to increment download count');
		}
	} catch (error) {
		console.error('Error incrementing download count:', error);
		throw error;
	}
}

/**
 * Rate a marketplace item
 * @param {string} itemId - The item ID
 * @param {number} rating - The rating (1-5)
 * @returns {Promise<void>}
 */
export async function rateMarketplaceItem(itemId, rating) {
	try {
		const response = await fetch(`/api/marketplace/${itemId}/rate`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ rating })
		});

		const data = await response.json();

		if (!data.success) {
			throw new Error(data.error || 'Failed to rate marketplace item');
		}
	} catch (error) {
		console.error('Error rating marketplace item:', error);
		throw error;
	}
}

/**
 * Convert marketplace item to kernel file format
 * @param {Object} item - The marketplace item
 * @returns {Object} - Kernel file format
 */
export function convertToKernelFile(item) {
	return {
		name: item.name,
		content: item.source,
		type: item.type === 'image' ? 'image' : item.type
	};
}

/**
 * Get default icon for item type
 * @param {string} type - The item type
 * @returns {string} - Icon URL or default icon
 */
export function getDefaultIcon(type) {
	const defaultIcons = {
		app: '/icons/app-default.svg',
		music: '/icons/music-default.svg',
		image: '/icons/photo-default.svg',
		video: '/icons/video-default.svg',
		document: '/icons/document-default.svg'
	};
	
	return defaultIcons[type] || '/icons/default.svg';
}

/**
 * Get default background color for item type
 * @param {string} type - The item type
 * @returns {string} - Background color
 */
export function getDefaultBackground(type) {
	const defaultBackgrounds = {
		app: '#007AFF',
		music: '#FF3B30',
		image: '#34C759',
		video: '#FF9500',
		document: '#5856D6'
	};
	
	return defaultBackgrounds[type] || '#8E8E93';
}

/**
 * Format file size
 * @param {number} bytes - File size in bytes
 * @returns {string} - Formatted file size
 */
export function formatFileSize(bytes) {
	if (bytes === 0) return '0 Bytes';
	
	const k = 1024;
	const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	
	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Format rating display
 * @param {number} rating - The rating
 * @param {number} count - The number of ratings
 * @returns {string} - Formatted rating display
 */
export function formatRating(rating, count) {
	if (count === 0) return 'No ratings';
	return `${rating.toFixed(1)} (${count} rating${count !== 1 ? 's' : ''})`;
}
