export const FONT_OPTIONS = ['Noto Sans', 'Segoe UI', 'Segoe WP', 'Segoe WP Light', 'selawik', 'selawik light'];

let activeFont = null;

export function formatFontFamily(font) {
	return font.includes(' ') ? `"${font}", sans-serif` : font;
}

export function applyAppFont(font) {
	if (typeof document === 'undefined' || !font) return;
	document.body.style.fontFamily = formatFontFamily(font);
}

export function ensureAppFontLoaded(font) {
	if (typeof document === 'undefined' || !font || font === activeFont) return;
	activeFont = font;
	applyAppFont(font);
}

export function unloadAppFont() {
	activeFont = null;
}
