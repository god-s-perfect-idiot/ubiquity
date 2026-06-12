/** Result source categories for grouped Spotlight-style search. */
export const RESULT_GROUPS = {
	SMART: 'smart',
	APPS: 'apps',
	SETTINGS: 'settings',
	ACTIONS: 'actions',
	FILES: 'files',
	WEB: 'web'
};

export const GROUP_LABELS = {
	[RESULT_GROUPS.SMART]: 'Suggestions',
	[RESULT_GROUPS.APPS]: 'Apps',
	[RESULT_GROUPS.SETTINGS]: 'Settings',
	[RESULT_GROUPS.ACTIONS]: 'Actions',
	[RESULT_GROUPS.FILES]: 'Your files',
	[RESULT_GROUPS.WEB]: 'Web'
};

export const GROUP_ORDER = [
	RESULT_GROUPS.SMART,
	RESULT_GROUPS.APPS,
	RESULT_GROUPS.SETTINGS,
	RESULT_GROUPS.ACTIONS,
	RESULT_GROUPS.FILES,
	RESULT_GROUPS.WEB
];

/** How a result should be activated. */
export const RESULT_ACTIONS = {
	NAVIGATE: 'navigate',
	OPEN_URL: 'open-url',
	SEARCH_WEB: 'search-web',
	COPY: 'copy'
};
