import { json } from '@sveltejs/kit';

export async function GET({ url }) {
	try {
		const q = url.searchParams.get('q') || '';
		const page = url.searchParams.get('page') || '1';
		const api = `https://gutendex.com/books/?search=${encodeURIComponent(q)}&page=${page}`;
		const resp = await fetch(api);

		if (!resp.ok) {
			return json({ error: 'Search request failed' }, { status: resp.status });
		}

		return json(await resp.json());
	} catch (error) {
		console.error('Books search error:', error);
		return json({ error: error.message }, { status: 500 });
	}
}
