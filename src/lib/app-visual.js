import { appInfoStore } from '../store/appInfo.js';
import { getFaviconUrl, getAppBackgroundColor } from '../kernel/favicon-utils.js';

/**
 * @param {{ name: string, content?: string, url?: string }} app
 */
export function getAppInfoForApp(app) {
	return (
		appInfoStore.getAppInfo(app.name) ||
		appInfoStore.getAppInfo(app.content) ||
		appInfoStore.getAppInfo(app.url)
	);
}

/**
 * Resolve thumbnail URL for an installed app (saved icon or favicon).
 * @param {Object} app
 * @param {Object} [faviconCache]
 * @returns {string|null}
 */
export function resolveAppIconSrc(app, faviconCache = {}) {
	const appInfo = getAppInfoForApp(app);

	if (
		appInfo?.icon &&
		(appInfo.icon.startsWith('http://') || appInfo.icon.startsWith('https://'))
	) {
		return appInfo.icon;
	}

	if (faviconCache[app.name]?.url) {
		return faviconCache[app.name].url;
	}

	if (app.url?.startsWith('http')) {
		return getFaviconUrl(app.url);
	}

	return null;
}

/**
 * Resolve iconify icon name when no image thumbnail is available.
 * @param {Object} app
 * @returns {string}
 */
export function resolveAppIconify(app) {
	const appInfo = getAppInfoForApp(app);

	if (appInfo?.icon && !appInfo.icon.startsWith('http')) {
		return appInfo.icon;
	}

	if (app.icon && !app.icon.startsWith('http')) {
		return app.icon;
	}

	return 'mdi:application';
}

/**
 * Resolve saved / inferred background color for an app tile.
 * @param {Object} app
 * @param {Object} [faviconCache]
 * @returns {string}
 */
export function resolveAppBgColor(app, faviconCache = {}) {
	const appInfo = getAppInfoForApp(app);

	return (
		appInfo?.bgColor ||
		appInfo?.backgroundColor ||
		app.bgColor ||
		faviconCache[app.name]?.bgColor ||
		(app.url?.startsWith('http') ? getAppBackgroundColor(app.url) : '') ||
		''
	);
}

/**
 * Build class + inline style for a tile background.
 * @param {string} bgColor
 * @param {string} [fallback]
 */
export function resolveBgPresentation(bgColor, hexFallback = '') {
	if (!bgColor) {
		return hexFallback
			? { bgClass: '', bgStyle: `background-color: ${hexFallback};` }
			: { bgClass: '', bgStyle: '' };
	}

	if (bgColor.startsWith('#')) {
		return { bgClass: '', bgStyle: `background-color: ${bgColor};` };
	}

	return { bgClass: bgColor, bgStyle: '' };
}

export function isIconUrl(value) {
	return (
		typeof value === 'string' &&
		(value.startsWith('http://') || value.startsWith('https://'))
	);
}

/**
 * Split a stored icon field into image URL vs iconify name.
 * @param {string} [icon]
 * @param {string} [fallbackIconify]
 */
export function splitIconFields(icon, fallbackIconify = 'mdi:magnify') {
	if (isIconUrl(icon)) {
		return { iconSrc: icon, iconify: fallbackIconify };
	}

	return { iconSrc: '', iconify: icon || fallbackIconify };
}

/**
 * Full visual bundle for rendering an app in lists / search.
 * @param {Object} app
 * @param {Object} [faviconCache]
 * @param {string} [accentColor]
 */
export function resolveAppVisual(app, faviconCache = {}, accentColor = '') {
	if (app.isSystemApp) {
		const bgColor = app.bgColor || '';
		const bg = resolveBgPresentation(bgColor, accentColor);

		return {
			isSystemApp: true,
			iconSrc: null,
			iconify: app.icon || 'mdi:application',
			bgClass: bg.bgClass,
			bgStyle: bg.bgStyle,
			initial: null
		};
	}

	const iconSrc = resolveAppIconSrc(app, faviconCache);
	const bgColor = resolveAppBgColor(app, faviconCache);
	const bg = resolveBgPresentation(bgColor, bgColor ? '' : '');

	return {
		isSystemApp: false,
		iconSrc,
		iconify: resolveAppIconify(app),
		bgClass: bg.bgClass || (bgColor ? '' : 'bg-white'),
		bgStyle: bg.bgStyle,
		initial: app.name?.charAt(0)?.toUpperCase() || '?'
	};
}
