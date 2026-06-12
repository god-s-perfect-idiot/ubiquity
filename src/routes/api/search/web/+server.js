import { json } from '@sveltejs/kit';

const USER_AGENT = 'Ubiquity Search/1.0';

async function searchWikipedia(query, limit = 8) {
	const params = new URLSearchParams({
		action: 'query',
		list: 'search',
		srsearch: query,
		format: 'json',
		srlimit: String(limit),
		origin: '*'
	});

	const response = await fetch(`https://en.wikipedia.org/w/api.php?${params}`, {
		headers: { Accept: 'application/json', 'User-Agent': USER_AGENT }
	});

	if (!response.ok) {
		throw new Error(`Wikipedia HTTP ${response.status}`);
	}

	const data = await response.json();
	const items = data?.query?.search || [];

	return items.map((item) => ({
		title: item.title,
		url: `https://en.wikipedia.org/wiki/${encodeURIComponent(item.title.replace(/ /g, '_'))}`,
		description: item.snippet?.replace(/<[^>]+>/g, '') || '',
		engine: 'Wikipedia',
		category: 'general'
	}));
}

async function searchDuckDuckGo(query) {
	const params = new URLSearchParams({
		q: query,
		format: 'json',
		no_html: '1',
		skip_disambig: '1'
	});

	const response = await fetch(`https://api.duckduckgo.com/?${params}`, {
		headers: { Accept: 'application/json', 'User-Agent': USER_AGENT }
	});

	if (!response.ok) {
		throw new Error(`DuckDuckGo HTTP ${response.status}`);
	}

	const data = await response.json();
	const results = [];

	if (data.AbstractText) {
		results.push({
			title: data.Heading || 'DuckDuckGo Answer',
			url: data.AbstractURL || `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
			description: data.AbstractText,
			engine: 'DuckDuckGo',
			category: 'general'
		});
	}

	if (data.Answer) {
		results.push({
			title: data.AnswerType || 'Instant answer',
			url: `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
			description: data.Answer,
			engine: 'DuckDuckGo',
			category: 'general'
		});
	}

	if (Array.isArray(data.RelatedTopics)) {
		for (const item of data.RelatedTopics) {
			if (item.FirstURL && item.Text) {
				results.push({
					title: item.Text.split(' - ')[0] || item.Text,
					url: item.FirstURL,
					description: item.Text,
					engine: 'DuckDuckGo',
					category: 'general'
				});
			} else if (Array.isArray(item.Topics)) {
				for (const topic of item.Topics) {
					if (topic.FirstURL && topic.Text) {
						results.push({
							title: topic.Text.split(' - ')[0] || topic.Text,
							url: topic.FirstURL,
							description: topic.Text,
							engine: 'DuckDuckGo',
							category: 'general'
						});
					}
				}
			}
		}
	}

	return results;
}

export async function GET({ url }) {
	const query = url.searchParams.get('q')?.trim() || '';
	const engine = (url.searchParams.get('engine') || 'AUTO').toUpperCase();
	const limit = Math.min(25, Math.max(1, parseInt(url.searchParams.get('limit') || '10', 10) || 10));

	if (!query) {
		return json({ results: [], engine });
	}

	try {
		let results = [];

		if (engine === 'WIKIPEDIA') {
			results = await searchWikipedia(query, limit);
		} else if (engine === 'DUCKDUCKGO') {
			results = (await searchDuckDuckGo(query)).slice(0, limit);
		} else {
			const [ddg, wiki] = await Promise.allSettled([
				searchDuckDuckGo(query),
				searchWikipedia(query, Math.min(5, limit))
			]);

			const merged = [];
			const seen = new Set();

			for (const batch of [ddg, wiki]) {
				if (batch.status !== 'fulfilled') continue;
				for (const item of batch.value) {
					if (!item.url || seen.has(item.url)) continue;
					seen.add(item.url);
					merged.push(item);
				}
			}

			results = merged.slice(0, limit);
		}

		return json({ results, engine, query });
	} catch (error) {
		console.error('Web search API error:', error);
		return json(
			{ error: 'Web search is temporarily unavailable.', results: [], engine, query },
			{ status: 503 }
		);
	}
}
