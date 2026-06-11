export async function searchBooks(query, page = 1) {
	const params = new URLSearchParams({ q: query, page: String(page) });
	const resp = await fetch(`/api/books/search?${params}`);
	if (!resp.ok) throw new Error('Book search failed');
	return resp.json();
}

export async function fetchBookDetails(gutenbergId) {
	const resp = await fetch(`/api/books/${gutenbergId}`);
	if (!resp.ok) throw new Error('Failed to load book details');
	return resp.json();
}

export async function fetchBookText(gutenbergId) {
	const resp = await fetch(`/api/books/${gutenbergId}?text=true`);
	if (!resp.ok) throw new Error('Failed to load book text');
	return resp.json();
}
