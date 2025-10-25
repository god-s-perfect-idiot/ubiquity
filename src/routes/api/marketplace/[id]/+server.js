import { json } from '@sveltejs/kit';
import {
	getMarketplaceItem,
	updateMarketplaceItem,
	deleteMarketplaceItem,
	incrementDownloadCount,
	rateMarketplaceItem
} from '../../../../lib/marketplace-api.js';

export async function GET({ params }) {
	try {
		const item = await getMarketplaceItem(params.id);
		
		if (!item) {
			return json({ success: false, error: 'Item not found' }, { status: 404 });
		}

		return json({ success: true, item });
	} catch (error) {
		console.error('Error in marketplace item GET:', error);
		return json({ success: false, error: error.message }, { status: 500 });
	}
}

export async function PUT({ params, request }) {
	try {
		const updateData = await request.json();
		
		// Remove fields that shouldn't be updated directly
		delete updateData.id;
		delete updateData.createdAt;
		delete updateData.downloads;
		delete updateData.rating;
		delete updateData.ratingCount;

		await updateMarketplaceItem(params.id, updateData);
		
		return json({ success: true });
	} catch (error) {
		console.error('Error in marketplace item PUT:', error);
		return json({ success: false, error: error.message }, { status: 500 });
	}
}

export async function DELETE({ params }) {
	try {
		await deleteMarketplaceItem(params.id);
		return json({ success: true });
	} catch (error) {
		console.error('Error in marketplace item DELETE:', error);
		return json({ success: false, error: error.message }, { status: 500 });
	}
}
