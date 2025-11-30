import { json } from '@sveltejs/kit';
import {
	getLiveTilesByUrl,
	getAllLiveTiles,
	addLiveTile
} from '../../../lib/livetiles-api.js';

export async function GET({ url }) {
	try {
		const appUrl = url.searchParams.get('url');
		const limit = parseInt(url.searchParams.get('limit')) || 50;
		const orderBy = url.searchParams.get('orderBy') || 'createdAt';
		const orderDirection = url.searchParams.get('orderDirection') || 'desc';

		let tiles;

		if (appUrl) {
			// Get tiles by URL
			tiles = await getLiveTilesByUrl(appUrl, {
				limitCount: limit,
				orderByField: orderBy,
				orderDirection
			});
		} else {
			// Get all tiles
			tiles = await getAllLiveTiles({
				limitCount: limit,
				orderByField: orderBy,
				orderDirection
			});
		}

		return json({ success: true, tiles });
	} catch (error) {
		console.error('Error in livetiles GET:', error);
		return json({ success: false, error: error.message }, { status: 500 });
	}
}

export async function POST({ request }) {
	try {
		const tileData = await request.json();

		// Validate required fields
		const requiredFields = ['appUrl', 'appName', 'tile4x2', 'tile2x2', 'owner', 'ownerId'];
		const missingFields = requiredFields.filter(field => !tileData[field]);
		
		if (missingFields.length > 0) {
			return json({ 
				success: false, 
				error: `Missing required fields: ${missingFields.join(', ')}` 
			}, { status: 400 });
		}

		const tileId = await addLiveTile(tileData);
		
		return json({ success: true, tileId }, { status: 201 });
	} catch (error) {
		console.error('Error in livetiles POST:', error);
		return json({ success: false, error: error.message }, { status: 500 });
	}
}

