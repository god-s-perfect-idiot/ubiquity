import { json } from '@sveltejs/kit';
import { incrementDownloadCount } from '../../../../../lib/livetiles-api.js';

export async function POST({ params }) {
	try {
		await incrementDownloadCount(params.id);
		return json({ success: true });
	} catch (error) {
		console.error('Error in live tile download:', error);
		return json({ success: false, error: error.message }, { status: 500 });
	}
}

