import { json } from '@sveltejs/kit';
import {
	fetchWithTimeout,
	gutenbergFallbackBook,
	pickTextUrl,
	stripGutenbergBoilerplate,
	paginateText
} from '../../../../lib/books-utils.js';

export async function GET({ params, url }) {
	try {
		const { id } = params;
		let book;

		try {
			const metaResp = await fetchWithTimeout(`https://gutendex.com/books/${id}`);
			book = metaResp.ok ? await metaResp.json() : gutenbergFallbackBook(id);
		} catch {
			book = gutenbergFallbackBook(id);
		}

		if (url.searchParams.get('text') !== 'true') {
			return json(book);
		}

		const textUrl = pickTextUrl(book.formats);
		if (!textUrl) {
			return json({ error: 'No readable text format available' }, { status: 404 });
		}

		const textResp = await fetchWithTimeout(textUrl, {}, 15000);
		if (!textResp.ok) {
			return json({ error: 'Failed to fetch book text' }, { status: textResp.status });
		}

		const raw = await textResp.text();
		const cleaned = stripGutenbergBoilerplate(raw);
		const pages = paginateText(cleaned);

		return json({ pages, pageCount: pages.length });
	} catch (error) {
		console.error('Books fetch error:', error);
		return json({ error: error.message }, { status: 500 });
	}
}
