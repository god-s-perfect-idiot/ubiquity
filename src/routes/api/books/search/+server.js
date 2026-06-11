import { json } from '@sveltejs/kit';
import { searchGutendex, searchOpenLibrary } from '../../../../lib/books-utils.js';

export async function GET({ url }) {
	const q = url.searchParams.get('q')?.trim() || '';
	const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10) || 1);

	if (!q) {
		return json({ count: 0, next: null, previous: null, results: [] });
	}

	try {
		return json(await searchOpenLibrary(q, page));
	} catch (openLibraryError) {
		console.warn('Open Library search failed, trying Gutendex:', openLibraryError.message);

		try {
			return json(await searchGutendex(q, page));
		} catch (gutendexError) {
			console.error('Books search error:', gutendexError);
			return json(
				{ error: 'Book search is temporarily unavailable. Please try again.' },
				{ status: 503 }
			);
		}
	}
}
