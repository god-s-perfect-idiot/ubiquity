import { browser } from '$app/environment';
import { SYSTEM_APPS } from './system-apps.js';
import { RESULT_GROUPS, RESULT_ACTIONS } from './search-types.js';
import { kernel } from '../kernel/store.js';
import {
	fetchApps,
	fetchPhotos,
	fetchMusic,
	fetchVideos,
	fetchDocuments,
	fetchBooks
} from '../kernel/system-utils.js';
import { appInfoStore } from '../store/appInfo.js';
import { getFaviconUrls } from '../kernel/favicon-utils.js';
import { resolveAppVisual, splitIconFields, resolveBgPresentation } from './app-visual.js';

const SETTINGS_PAGES = [
	{
		id: 'display',
		title: 'Display',
		description: 'Change display settings, font scale, and screen options',
		page: 'display',
		keywords: ['font', 'screen', 'brightness', 'scale']
	},
	{
		id: 'theme',
		title: 'Start + Theme',
		description: 'Choose light or dark theme and accent color',
		page: 'theme',
		keywords: ['dark', 'light', 'accent', 'color', 'homescreen']
	},
	{
		id: 'lock-screen',
		title: 'Lock Screen',
		description: 'Customize lock screen appearance and wallpaper',
		page: 'lock-screen',
		keywords: ['wallpaper', 'pin', 'background']
	},
	{
		id: 'apps',
		title: 'Apps',
		description: 'Check installed apps and edit app info',
		page: 'apps',
		keywords: ['installed', 'applications']
	},
	{
		id: 'storage',
		title: 'Storage',
		description: 'Explore local storage usage on this device',
		page: 'storage',
		keywords: ['disk', 'space', 'localstorage']
	},
	{
		id: 'security',
		title: 'Security',
		description: 'Set your PIN code and encryption for your data',
		page: 'security',
		keywords: ['pin', 'password', 'encryption', 'lock']
	},
	{
		id: 'search',
		title: 'Search',
		description: 'Change search engine and search settings',
		page: 'search',
		keywords: ['engine', 'duckduckgo', 'wikipedia']
	},
	{
		id: 'accounts',
		title: 'Accounts',
		description: 'Spotify, YouTube Music, ImgBB, and other accounts',
		page: 'accounts',
		keywords: ['spotify', 'login', 'connect', 'imgbb']
	},
	{
		id: 'region+units',
		title: 'Region + Units',
		description: 'Change region and units of measurement',
		page: 'region+units',
		keywords: ['timezone', 'celsius', 'fahrenheit', 'metric']
	},
	{
		id: 'data',
		title: 'Data',
		description: 'System data related information',
		page: 'data',
		keywords: ['system', 'info']
	},
	{
		id: 'device-info',
		title: 'Device Information',
		description: 'Device-level information from the browser',
		page: 'device-info',
		keywords: ['navigator', 'hardware', 'browser']
	}
];

const QUICK_ACTIONS = [
	{
		id: 'new-file',
		title: 'Create new file',
		description: 'Add a new file to your device',
		url: '/new/file',
		icon: 'mdi:file-plus',
		keywords: ['add', 'create', 'upload']
	},
	{
		id: 'new-dir',
		title: 'Create new folder',
		description: 'Add a new directory',
		url: '/new/dir',
		icon: 'mdi:folder-plus',
		keywords: ['directory', 'folder', 'create']
	},
	{
		id: 'lock',
		title: 'Lock screen',
		description: 'Go to the lock screen',
		url: '/lock',
		icon: 'mdi:lock',
		keywords: ['sleep', 'pin']
	},
	{
		id: 'onboarding',
		title: 'Run setup again',
		description: 'Re-run the onboarding experience',
		url: '/onboarding',
		icon: 'mdi:rocket-launch',
		keywords: ['setup', 'welcome', 'tutorial']
	},
	{
		id: 'marketplace-publish',
		title: 'Browse marketplace',
		description: 'Discover apps, music, photos, and more',
		url: '/marketplace',
		icon: 'ic:sharp-store',
		keywords: ['download', 'discover', 'store']
	}
];

const FILE_ROUTES = {
	image: '/photos',
	document: '/documents',
	music: '/music',
	video: '/video',
	book: '/books'
};

const FILE_ICONS = {
	image: 'tdesign:image-filled',
	document: 'ix:document-filled',
	music: 'ic:sharp-headphones',
	video: 'tdesign:video-filled',
	book: 'mdi:book-open-page-variant',
	app: 'mdi:application'
};

function normalize(text) {
	return (text || '').toLowerCase().trim();
}

function tokenize(query) {
	return normalize(query).split(/\s+/).filter(Boolean);
}

function scoreMatch(query, fields) {
	const tokens = tokenize(query);
	if (tokens.length === 0) return 0;

	const haystack = fields.map(normalize).join(' ');
	let score = 0;

	for (const token of tokens) {
		if (haystack === token) score += 120;
		else if (haystack.startsWith(token)) score += 80;
		else if (haystack.includes(` ${token}`)) score += 50;
		else if (haystack.includes(token)) score += 30;
	}

	return score;
}

function makeResult(data) {
	return {
		id: data.id,
		title: data.title,
		subtitle: data.subtitle || '',
		description: data.description || '',
		url: data.url || '',
		action: data.action || RESULT_ACTIONS.NAVIGATE,
		type: data.type,
		icon: data.icon || 'mdi:magnify',
		iconSrc: data.iconSrc || '',
		iconify: data.iconify || data.icon || '',
		bgClass: data.bgClass || '',
		bgStyle: data.bgStyle || '',
		initial: data.initial || '',
		overrideClass: data.overrideClass || '',
		rowOverrideClass: data.rowOverrideClass || '',
		contentOverrideClass: data.contentOverrideClass || '',
		category: data.type,
		engine: 'Ubiquity',
		score: data.score || 0,
		metadata: data.metadata || {}
	};
}

function getFilesystem() {
	let fs = null;
	kernel.subscribe((value) => {
		fs = value;
	})();
	return fs;
}

function buildAppResults(query) {
	const fs = getFilesystem();
	const installed = fs ? fetchApps(fs.getFiles()) : [];
	const faviconCache = getFaviconUrls(installed);

	const allApps = [
		...SYSTEM_APPS.map((app) => ({ ...app, url: app.content })),
		...installed.map((app) => {
			const appInfo = appInfoStore.getAppInfo(app.name);
			return {
				...app,
				keywords: [app.name, app.url, appInfo?.description || '']
			};
		})
	];

	return allApps
		.map((app) => {
			const score = scoreMatch(query, [
				app.name,
				...(app.keywords || []),
				app.url,
				app.content
			]);
			if (score <= 0) return null;

			const isExternal = !app.isSystemApp && app.url?.startsWith('http');
			const visual = resolveAppVisual(app, faviconCache);

			return makeResult({
				id: `app-${app.name}`,
				title: app.name,
				subtitle: isExternal ? 'Installed app' : 'System app',
				description: isExternal ? formatUrl(app.url) : `Open ${app.name}`,
				url: isExternal ? app.url : app.content || app.url,
				action: isExternal ? RESULT_ACTIONS.OPEN_URL : RESULT_ACTIONS.NAVIGATE,
				type: RESULT_GROUPS.APPS,
				icon: visual.iconify,
				iconSrc: visual.iconSrc || '',
				iconify: visual.iconify,
				bgClass: visual.bgClass,
				bgStyle: visual.bgStyle,
				initial: visual.initial || '',
				score,
				metadata: { isSystemApp: !!app.isSystemApp }
			});
		})
		.filter(Boolean);
}

function formatUrl(url) {
	try {
		const urlObj = new URL(url);
		return urlObj.hostname + urlObj.pathname;
	} catch {
		return url;
	}
}

function buildSettingsResults(query) {
	return SETTINGS_PAGES.map((setting) => {
		const score = scoreMatch(query, [
			setting.title,
			setting.description,
			...(setting.keywords || []),
			'settings'
		]);
		if (score <= 0) return null;

		const settingBg = resolveBgPresentation('bg-blue-800');

		return makeResult({
			id: `setting-${setting.id}`,
			title: setting.title,
			subtitle: 'Settings',
			description: setting.description,
			url: `/settings?page=${setting.page}`,
			type: RESULT_GROUPS.SETTINGS,
			icon: 'rivet-icons:settings',
			iconify: 'rivet-icons:settings',
			bgClass: settingBg.bgClass,
			bgStyle: settingBg.bgStyle,
			score,
			metadata: { settingsPage: setting.page }
		});
	}).filter(Boolean);
}

function buildActionResults(query) {
	return QUICK_ACTIONS.map((action) => {
		const score = scoreMatch(query, [
			action.title,
			action.description,
			...(action.keywords || []),
			'action'
		]);
		if (score <= 0) return null;

		const actionBg = resolveBgPresentation('bg-amber-800');

		return makeResult({
			id: `action-${action.id}`,
			title: action.title,
			subtitle: 'Action',
			description: action.description,
			url: action.url,
			type: RESULT_GROUPS.ACTIONS,
			icon: action.icon,
			iconify: action.icon,
			bgClass: actionBg.bgClass,
			bgStyle: actionBg.bgStyle,
			score
		});
	}).filter(Boolean);
}

function buildFileResults(query) {
	const fs = getFilesystem();
	if (!fs) return [];

	const files = fs.getFiles();
	const groups = [
		{ items: fetchPhotos(files), kind: 'image', label: 'Photo' },
		{ items: fetchMusic(files), kind: 'music', label: 'Music' },
		{ items: fetchVideos(files), kind: 'video', label: 'Video' },
		{ items: fetchDocuments(files), kind: 'document', label: 'Document' },
		{ items: fetchBooks(files), kind: 'book', label: 'Book' }
	];

	const results = [];

	for (const group of groups) {
		for (const file of group.items) {
			const score = scoreMatch(query, [file.name, group.label, file.content]);
			if (score <= 0) continue;

			const fileBg = resolveBgPresentation('bg-orange-800');
			const isPreviewable =
				group.kind === 'image' &&
				typeof file.content === 'string' &&
				(file.content.startsWith('http') ||
					file.content.startsWith('data:') ||
					file.content.startsWith('blob:'));

			results.push(
				makeResult({
					id: `file-${group.kind}-${file.name}`,
					title: file.name,
					subtitle: group.label,
					description: `Open in ${group.label.toLowerCase()}`,
					url: FILE_ROUTES[group.kind] || '/files',
					type: RESULT_GROUPS.FILES,
					icon: FILE_ICONS[group.kind],
					iconify: FILE_ICONS[group.kind],
					iconSrc: isPreviewable ? file.content : '',
					bgClass: isPreviewable ? 'bg-black' : fileBg.bgClass,
					bgStyle: fileBg.bgStyle,
					overrideClass: isPreviewable ? '!w-16 !h-16 !p-0' : '',
					contentOverrideClass: isPreviewable ? '!p-0 object-cover' : '',
					score,
					metadata: { fileName: file.name, fileType: group.kind }
				})
			);
		}
	}

	return results;
}

function buildResourceResults(query) {
	if (!browser) return [];

	const results = [];
	const appInfo = appInfoStore.getState().apps;

	for (const [key, info] of Object.entries(appInfo)) {
		const score = scoreMatch(query, [
			key,
			info?.name,
			info?.description,
			info?.category,
			info?.url
		]);
		if (score <= 0) continue;

		const { iconSrc, iconify } = splitIconFields(info?.icon, 'mdi:bookmark');
		const resourceBg = resolveBgPresentation(
			info?.bgColor || info?.backgroundColor || '',
			''
		);

		results.push(
			makeResult({
				id: `resource-${key}`,
				title: info?.name || key,
				subtitle: 'Saved resource',
				description: info?.description || info?.category || 'App info saved on this device',
				url: info?.url || '/settings?page=apps',
				action: info?.url?.startsWith('http')
					? RESULT_ACTIONS.OPEN_URL
					: RESULT_ACTIONS.NAVIGATE,
				type: RESULT_GROUPS.FILES,
				icon: iconify,
				iconSrc,
				iconify,
				bgClass: resourceBg.bgClass || 'bg-orange-800',
				bgStyle: resourceBg.bgStyle,
				score: score - 5,
				metadata: { resourceKey: key }
			})
		);
	}

	return results;
}

/**
 * Search local apps, settings, actions, and saved files/resources.
 * @param {string} query
 * @param {number} limit
 * @returns {Array<Object>}
 */
export function searchLocal(query, limit = 12) {
	const trimmed = query.trim();
	if (!trimmed) return [];

	const results = [
		...buildAppResults(trimmed),
		...buildSettingsResults(trimmed),
		...buildActionResults(trimmed),
		...buildFileResults(trimmed),
		...buildResourceResults(trimmed)
	];

	return results.sort((a, b) => b.score - a.score).slice(0, limit);
}
