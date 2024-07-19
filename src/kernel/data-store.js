/* Data store synchronises data with local storage */

export function commit(key, state) {
	if (typeof window !== 'undefined') localStorage.setItem(key, JSON.stringify(state));
}

export function load(key) {
	if (typeof window !== 'undefined') return JSON.parse(localStorage.getItem(key));
	return null;
}
