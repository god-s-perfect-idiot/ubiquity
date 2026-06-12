<script>
	import { formatUrl, getFaviconUrl } from '../../lib/search-utils.js';
	import { RESULT_GROUPS } from '../../lib/search-types.js';
	import { resolveBgPresentation, splitIconFields } from '../../lib/app-visual.js';
	import Icon from '@iconify/svelte';
	import Loader from '../../components/Loader.svelte';
	import Button from '../../components/Button.svelte';
	import { accentColorStore } from '../../utils/theme';

	export let results = [];
	export let groups = [];
	export let loading = false;
	export let error = null;
	export let onResultClick = null;
	export let finalSearchQuery = '';
	export let selectedIndex = -1;

	$: accentColor = $accentColorStore;
	$: flatResults = groups.length ? groups.flatMap((group) => group.results) : results;

	/** Per-type tile icon, colors, and layout overrides. */
	const typeTiles = {
		[RESULT_GROUPS.APPS]: {
			icon: 'mdi:application',
			bg: '',
			overrideClass: 'w-12 h-12',
			rowOverrideClass: '',
			contentOverrideClass: ''
		},
		[RESULT_GROUPS.SETTINGS]: {
			icon: 'rivet-icons:settings',
			bg: 'bg-blue-800',
			overrideClass: '!w-16 !h-16 !p-2',
			rowOverrideClass: '',
			contentOverrideClass: 'w-6 h-6'
		},
		[RESULT_GROUPS.ACTIONS]: {
			icon: 'mdi:lightning-bolt',
			bg: 'bg-amber-800',
			overrideClass: 'w-11 h-11',
			rowOverrideClass: '',
			contentOverrideClass: 'w-6 h-6'
		},
		[RESULT_GROUPS.FILES]: {
			icon: 'material-symbols:folder',
			bg: 'bg-orange-800',
			overrideClass: '!w-16 !h-16 !p-2',
			rowOverrideClass: 'items-start',
			contentOverrideClass: '!p-0 object-cover'
		},
		[RESULT_GROUPS.SMART]: {
			icon: 'mdi:calculator',
			bg: 'bg-green-800',
			overrideClass: '!w-16 !h-16',
			rowOverrideClass: 'items-start',
			contentOverrideClass: '!w-9 !h-9'
		},
		[RESULT_GROUPS.WEB]: {
			icon: 'mdi:web',
			bg: 'bg-white',
			overrideClass: 'w-11 h-11',
			rowOverrideClass: 'items-start',
			contentOverrideClass: '!p-1.5'
		}
	};

	function resolveViewClasses(result, typeConfig) {
		return {
			overrideClass: result.overrideClass || typeConfig.overrideClass || 'w-12 h-12',
			rowOverrideClass: result.rowOverrideClass || typeConfig.rowOverrideClass || '',
			contentOverrideClass: result.contentOverrideClass || typeConfig.contentOverrideClass || ''
		};
	}

	function handleResultClick(result) {
		if (onResultClick) {
			onResultClick(result);
		}
	}

	function formatDescription(description) {
		if (description && description.length > 120) {
			return description.substring(0, 120) + '...';
		}
		return description || '';
	}

	function isInternal(result) {
		return result.url?.startsWith('/');
	}

	function resultIndex(result) {
		return flatResults.indexOf(result);
	}

	function tileForResult(result) {
		const typeConfig = typeTiles[result.type] || typeTiles[RESULT_GROUPS.ACTIONS];
		const view = resolveViewClasses(result, typeConfig);

		if (result.type === RESULT_GROUPS.APPS) {
			const isSystem = result.metadata?.isSystemApp;
			let bgClass = result.bgClass || '';
			let bgStyle = result.bgStyle || '';

			if (!bgClass && !bgStyle) {
				if (isSystem) {
					bgStyle = `background-color: ${accentColor};`;
				} else {
					bgClass = 'bg-white';
				}
			}

			return {
				iconSrc: result.iconSrc || '',
				iconify: result.iconify || result.icon || 'mdi:application',
				bgClass,
				bgStyle,
				...view,
				initial: result.initial || result.title?.charAt(0)?.toUpperCase() || '?',
				useLightIcon: bgClass === 'bg-white'
			};
		}

		if (result.type === RESULT_GROUPS.WEB) {
			const webBg = resolveBgPresentation(typeConfig.bg);
			return {
				iconSrc: result.favicon || (result.url ? getFaviconUrl(result.url) : ''),
				iconify: 'mdi:web',
				bgClass: webBg.bgClass,
				bgStyle: webBg.bgStyle,
				initial: '',
				useLightIcon: false,
				...view
			};
		}

		const { iconSrc, iconify } = splitIconFields(
			result.iconSrc || result.iconify || result.icon,
			typeConfig.icon
		);
		const bg = resolveBgPresentation(
			result.bgClass ? '' : typeConfig.bg,
			result.bgStyle?.replace('background-color: ', '').replace(';', '') || ''
		);

		return {
			iconSrc: result.iconSrc || iconSrc,
			iconify: result.iconify || iconify,
			...view,
			bgClass: result.bgClass || bg.bgClass || typeConfig.bg,
			bgStyle: result.bgStyle || bg.bgStyle,
			initial: result.initial || result.title?.charAt(0)?.toUpperCase() || '?',
			useLightIcon: false
		};
	}

	function showDescription(result) {
		if (result.type === RESULT_GROUPS.APPS && result.subtitle === 'Installed app') {
			return false;
		}
		return !!result.description;
	}

	let brokenImages = new Set();

	function imageKey(result, tile) {
		return `${result.id}-${tile.iconSrc}`;
	}

	function onImageError(key) {
		brokenImages = new Set([...brokenImages, key]);
	}
</script>

<div>
	{#if loading && flatResults.length === 0}
		<div class="flex items-center justify-center py-24 mt-12">
			<Loader />
		</div>
	{:else if error}
		<div class="flex flex-col items-start justify-center py-12 text-left">
			<Icon icon="material-symbols:error-outline" class="w-16 h-16 text-red-500" />
			<p class="text-red-400 mb-4 text-lg">{error}</p>
			<Button text="try again" onClick={() => window.location.reload()} />
		</div>
	{:else if flatResults.length === 0}
		{#if finalSearchQuery.trim() !== ''}
			<div class="flex flex-col items-start justify-center py-12">
				<Icon icon="material-symbols:search-off" class="w-16 h-16 text-gray-500 mb-4" />
				<p class="text-gray-400">No results found</p>
				<p class="text-sm text-gray-500 mt-2">
					Try apps, settings, files, math (= 2+2), or web keywords
				</p>
			</div>
		{:else}
			<div class="flex flex-col gap-6 py-6 text-left">
				<p class="text-lg text-[#a1a1a1]">Search everything on your device and the web</p>
				<div class="flex flex-col gap-3 text-base">
					<span class="flex items-center gap-3">
						<span class="result-tile bg-red-800 p-2"
							><Icon icon="mdi:application" class="w-6 h-6 text-white" /></span
						>
						Apps — "photos", "weather", "spotify"
					</span>
					<span class="flex items-center gap-3">
						<span class="result-tile bg-blue-800 p-2"
							><Icon icon="rivet-icons:settings" class="w-6 h-6 text-white" /></span
						>
						Settings — "theme", "security", "accounts"
					</span>
					<span class="flex items-center gap-3">
						<span class="result-tile bg-green-800 p-2"
							><Icon icon="mdi:calculator" class="w-6 h-6 text-white" /></span
						>
						Smart — "= 15 * 24", "10 km to miles", "now"
					</span>
					<span class="flex items-center gap-3">
						<span class="result-tile bg-purple-800 p-2"
							><Icon icon="mdi:web" class="w-6 h-6 text-white" /></span
						>
						Web — any topic for instant answers and links
					</span>
				</div>
			</div>
		{/if}
	{:else}
		<div class="space-y-5 flex flex-col h-full pb-24">
			{#if loading}
				<div class="flex items-center gap-2 text-sm text-gray-500">
					<Loader />
					<span>Searching the web…</span>
				</div>
			{/if}

			{#each groups.length ? groups : [{ key: 'all', label: '', results }] as group (group.key)}
				{#if group.label}
					<div class="text-2xl tracking-wide lowercase pt-1" style="color: {accentColor};">
						{group.label}
					</div>
				{/if}

				<div class="space-y-1 pb-4">
					{#each group.results as result (result.id || result.url || result.title)}
						{@const idx = resultIndex(result)}
						{@const tile = tileForResult(result)}
						{@const imgKey = imageKey(result, tile)}
						{@const showImage = tile.iconSrc && !brokenImages.has(imgKey)}
						<div
							class="search-result flex gap-4 py-2.5 px-3 rounded-lg transition-all items-start {tile.rowOverrideClass}"
							class:selected={selectedIndex === idx}
							style={selectedIndex === idx ? `--accent: ${accentColor};` : ''}
							on:click={() => handleResultClick(result)}
							on:keydown={(e) => e.key === 'Enter' && handleResultClick(result)}
							role="button"
							tabindex="0"
						>
							<div
								class="result-tile flex-shrink-0 {tile.bgClass} {tile.overrideClass}"
								style={tile.bgStyle}
							>
								{#if showImage}
									<img
										src={tile.iconSrc}
										alt=""
										class="w-full h-full object-contain p-1.5 {tile.contentOverrideClass}"
										on:error={() => onImageError(imgKey)}
									/>
								{:else if tile.initial && result.type === RESULT_GROUPS.APPS}
									<span class="tile-initial {tile.contentOverrideClass}">{tile.initial}</span>
								{:else}
									<Icon
										icon={tile.iconify}
										class="w-7 h-7 {tile.contentOverrideClass} {tile.useLightIcon
											? 'text-gray-800'
											: 'text-white'}"
									/>
								{/if}
							</div>

							<div class="flex-1 min-w-0 text-left">
								<h3 class="text-xl font-[400] text-white truncate leading-tight">
									{result.title}
								</h3>

								{#if result.subtitle || result.url}
									<p class="text-sm text-[#9a9a9a] truncate mt-0.5">
										{#if result.type === RESULT_GROUPS.WEB}
											{formatUrl(result.url)}
										{:else if result.subtitle}
											{result.subtitle}
											{#if result.url && isInternal(result)}
												<span class="text-[#6a6a6a]"> · {formatUrl(result.url)}</span>
											{/if}
										{:else}
											{formatUrl(result.url)}
										{/if}
									</p>
								{/if}

								{#if showDescription(result)}
									<p class="text-[#b8b8b8] text-sm leading-snug mt-1 line-clamp-2">
										{formatDescription(result.description)}
									</p>
								{/if}

								{#if result.type === RESULT_GROUPS.WEB && result.engine}
									<span class="text-xs text-[#6a6a6a] mt-1 inline-block">{result.engine}</span>
								{/if}
							</div>

							<!-- <Icon
								icon={isInternal(result) ? 'mdi:chevron-right' : 'mdi:open-in-new'}
								class="w-5 h-5 text-[#5a5a5a] flex-shrink-0"
							/> -->
						</div>
					{/each}
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.result-tile {
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
		flex-shrink: 0;
	}

	.tile-initial {
		font-size: 1.25rem;
		font-weight: 300;
		color: white;
	}

	.search-result.selected {
		background: color-mix(in srgb, var(--accent) 18%, transparent);
		box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--accent) 45%, transparent);
	}

	.search-result:active {
		opacity: 0.85;
	}

	.line-clamp-2 {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>
