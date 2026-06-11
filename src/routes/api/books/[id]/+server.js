import { json } from '@sveltejs/kit';
import { pickTextUrl, stripGutenbergBoilerplate, paginateText } from '../../../../lib/books-utils.js';

export async function GET({ params, url }) {
	try {
		const { id } = params;
		const metaResp = await fetch(`https://gutendex.com/books/${id}`);

		if (!metaResp.ok) {
			return json({ error: 'Book not found' }, { status: metaResp.status });
		}

		const book = await metaResp.json();

		if (url.searchParams.get('text') !== 'true') {
			return json(book);
		}

		const textUrl = pickTextUrl(book.formats);
		if (!textUrl) {
			return json({ error: 'No readable text format available' }, { status: 404 });
		}

		const textResp = await fetch(textUrl);
		if (!textResp.ok) {
			return json({ error: 'Failed to fetch book text' }, { status: textResp.status });
		}

		const raw = await textResp.text();
		const cleaned = stripGutenbergBoilerplate(raw);
		const pages = paginateText(cleaned);

		return json({ text: cleaned, pages, pageCount: pages.length });
	} catch (error) {
		console.error('Books fetch error:', error);
		return json({ error: error.message }, { status: 500 });
	}
}
