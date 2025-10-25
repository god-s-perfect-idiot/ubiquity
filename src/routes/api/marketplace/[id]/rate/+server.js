import { json } from '@sveltejs/kit';
import { rateMarketplaceItem } from '../../../../../lib/marketplace-api.js';

export async function POST({ params, request }) {
	try {
		const { rating } = await request.json();
		
		if (!rating || rating < 1 || rating > 5) {
			return json({ 
				success: false, 
				error: 'Rating must be between 1 and 5' 
			}, { status: 400 });
		}

		await rateMarketplaceItem(params.id, rating);
		return json({ success: true });
	} catch (error) {
		console.error('Error in marketplace item rating:', error);
		return json({ success: false, error: error.message }, { status: 500 });
	}
}
