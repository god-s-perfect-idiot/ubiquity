import { json } from '@sveltejs/kit';
import {
	getMarketplaceItems,
	addMarketplaceItem,
	searchMarketplaceItems
} from '../../../lib/marketplace-api.js';

export async function GET({ url }) {
	try {
		const type = url.searchParams.get('type');
		const category = url.searchParams.get('category');
		const search = url.searchParams.get('search');
		const featured = url.searchParams.get('featured');
		const limit = parseInt(url.searchParams.get('limit')) || 50;
		const orderBy = url.searchParams.get('orderBy') || 'createdAt';
		const orderDirection = url.searchParams.get('orderDirection') || 'desc';

		let items;

		if (search) {
			items = await searchMarketplaceItems(search, {
				type,
				limitCount: limit
			});
		} else {
			// Only pass featured if it's explicitly set
			const options = {
				type,
				category,
				limitCount: limit,
				orderByField: orderBy,
				orderDirection
			};
			
			if (featured !== null) {
				options.featured = featured === 'true' ? true : false;
			}
			
			items = await getMarketplaceItems(options);
		}

		return json({ success: true, items });
	} catch (error) {
		console.error('Error in marketplace GET:', error);
		return json({ success: false, error: error.message }, { status: 500 });
	}
}

export async function POST({ request }) {
	try {
		const itemData = await request.json();

		// Validate required fields
		const requiredFields = ['type', 'name', 'description', 'owner', 'ownerId', 'source'];
		const missingFields = requiredFields.filter(field => !itemData[field]);
		
		if (missingFields.length > 0) {
			return json({ 
				success: false, 
				error: `Missing required fields: ${missingFields.join(', ')}` 
			}, { status: 400 });
		}

		// Validate type
		const validTypes = ['app', 'music', 'image', 'video', 'document'];
		if (!validTypes.includes(itemData.type)) {
			return json({ 
				success: false, 
				error: `Invalid type. Must be one of: ${validTypes.join(', ')}` 
			}, { status: 400 });
		}

		const itemId = await addMarketplaceItem(itemData);
		
		return json({ success: true, itemId }, { status: 201 });
	} catch (error) {
		console.error('Error in marketplace POST:', error);
		return json({ success: false, error: error.message }, { status: 500 });
	}
}
