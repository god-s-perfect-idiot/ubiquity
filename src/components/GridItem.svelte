<script>
	import { createEventDispatcher, onDestroy, onMount } from 'svelte';
	import Icon from '@iconify/svelte';
	import { appInfoStore } from '../store/appInfo.js';
	import { getFaviconUrl, getAppBackgroundColor } from '../kernel/favicon-utils.js';
	import {
		accentColorStore,
		textColorClassStore,
		backgroundClassStore,
		borderColorClassStore,
		backgroundThemeStore
	} from '../utils/theme';
	import LiveClock from '../routes/clock/Live.svelte';
	import LiveWeather from '../routes/weather/Live.svelte';
	import LivePhotos from '../routes/photos/Live.svelte';
	import LiveMusic from '../routes/music/Live.svelte';
	import LiveSpotify from '../routes/spotify/Live.svelte';
	import LiveYTMusic from '../routes/ytmusic/Live.svelte';

	export let item;
	export let editMode = false;
	export let isSelected = false;
	export let isDragging = false;
	export let isRemoving = false;

	const dispatch = createEventDispatcher();

	// Live tile flip animation state
	let isFlipping = false;
	let flipDirection = 'up';
	let flipAnimationTimer = null;

	// Idle "breathing" float used while reordering (WP8.1 edit mode). Each tile
	// gets a random pattern/delay/duration so the board feels organic.
	let floatPattern = 1;
	let floatDelay = 0;
	let floatDuration = 7;

	onMount(() => {
		floatPattern = 1 + Math.floor(Math.random() * 4);
		floatDelay = Math.random() * 0.6;
		floatDuration = 6 + Math.random() * 3;
	});

	$: idleFloat = editMode && !isSelected && !isDragging && !isRemoving;

	$: accentColor = $accentColorStore;
	$: textColorClass = $textColorClassStore;
	$: bgClass = $backgroundClassStore;
	$: borderClass = $borderColorClassStore;
	$: backgroundTheme = $backgroundThemeStore;

	function handleResize(event) {
		event.stopPropagation();
		dispatch('resize', { itemId: item.id });
	}

	function handleRemove(event) {
		event.stopPropagation();
		dispatch('remove', { itemId: item.id });
	}

	// Helper to extract color from Tailwind class
	function extractColorFromClass(bgColor) {
		if (!bgColor) return null;
		const match = bgColor.match(/bg-\[#([0-9a-fA-F]{6})\]/);
		return match ? `#${match[1]}` : null;
	}

	function isBlackColor(color) {
		if (!color || !color.startsWith('#')) return false;
		const hex = color.replace('#', '');
		if (hex.length !== 6) return false;
		const r = parseInt(hex.substr(0, 2), 16);
		const g = parseInt(hex.substr(2, 2), 16);
		const b = parseInt(hex.substr(4, 2), 16);
		return r < 15 && g < 15 && b < 15;
	}

	function isWhiteOrLightColor(color) {
		if (!color || !color.startsWith('#')) return false;
		const hex = color.replace('#', '');
		if (hex.length !== 6) return false;
		const r = parseInt(hex.substr(0, 2), 16);
		const g = parseInt(hex.substr(2, 2), 16);
		const b = parseInt(hex.substr(4, 2), 16);
		return r > 200 && g > 200 && b > 200;
	}

	function isWhiteColor(color) {
		if (!color || !color.startsWith('#')) return false;
		const hex = color.replace('#', '');
		if (hex.length !== 6) return false;
		const r = parseInt(hex.substr(0, 2), 16);
		const g = parseInt(hex.substr(2, 2), 16);
		const b = parseInt(hex.substr(4, 2), 16);
		return r > 240 && g > 240 && b > 240;
	}

	// Icon (as URL) from appInfo store or favicon fallback.
	$: iconSrc = (() => {
		const appInfo =
			appInfoStore.getAppInfo(item.name) ||
			appInfoStore.getAppInfo(item.src) ||
			(item.src && item.src.startsWith('http') ? appInfoStore.getAppInfo(item.src) : null);

		if (appInfo?.icon && (appInfo.icon.startsWith('http://') || appInfo.icon.startsWith('https://'))) {
			return appInfo.icon;
		} else if (item.src && item.src.startsWith('http')) {
			return getFaviconUrl(item.src);
		}
		return null;
	})();

	$: bgColor = (() => {
		const appInfo =
			appInfoStore.getAppInfo(item.name) ||
			appInfoStore.getAppInfo(item.src) ||
			(item.src && item.src.startsWith('http') ? appInfoStore.getAppInfo(item.src) : null);

		let finalBgColor = null;

		if (appInfo?.bgColor || appInfo?.backgroundColor) {
			const bgColorValue = appInfo.bgColor || appInfo.backgroundColor;
			const colorValue = extractColorFromClass(bgColorValue);
			if (colorValue) {
				if (!isBlackColor(colorValue)) finalBgColor = colorValue;
			} else if (bgColorValue.startsWith('#')) {
				if (!isBlackColor(bgColorValue)) finalBgColor = bgColorValue;
			} else if (bgColorValue.includes('white') || bgColorValue === 'bg-white') {
				finalBgColor = backgroundTheme === 'light' ? '#eeeeee' : '#ffffff';
			} else if (bgColorValue.includes('black') || bgColorValue === 'bg-black') {
				finalBgColor = backgroundTheme === 'dark' ? '#2a2a2a' : '#000000';
			} else {
				finalBgColor = bgColorValue;
			}
		}

		if (!finalBgColor && item.src && item.src.startsWith('http')) {
			const faviconBgColor = getAppBackgroundColor(item.src);
			const colorValue = extractColorFromClass(faviconBgColor);
			if (colorValue) {
				if (!isBlackColor(colorValue)) finalBgColor = colorValue;
			} else if (faviconBgColor.startsWith('#')) {
				if (!isBlackColor(faviconBgColor)) finalBgColor = faviconBgColor;
			} else if (faviconBgColor.includes('white') || faviconBgColor === 'bg-white') {
				finalBgColor = backgroundTheme === 'light' ? '#bebebe' : '#ffffff';
			} else if (faviconBgColor.includes('black') || faviconBgColor === 'bg-black') {
				finalBgColor = backgroundTheme === 'dark' ? '#2a2a2a' : '#000000';
			} else {
				finalBgColor = faviconBgColor;
			}
		}

		if (!finalBgColor) finalBgColor = accentColor;

		if (finalBgColor && finalBgColor.startsWith('#')) {
			if (backgroundTheme === 'light' && isWhiteColor(finalBgColor)) return '#eeeeee';
			if (backgroundTheme === 'dark' && isBlackColor(finalBgColor)) return '#2a2a2a';
		}

		return finalBgColor;
	})();

	$: useBlackText =
		(bgColor && bgColor.startsWith('#'))
			? isWhiteOrLightColor(bgColor)
			: bgColor && (bgColor.includes('white') || bgColor === 'bg-white');

	$: tileBgStyle = bgColor && bgColor.startsWith('#')
		? `background-color:${bgColor};`
		: (!bgColor || (!bgColor.startsWith('#') && !bgColor.includes('bg-')))
			? `background-color:${accentColor};`
			: '';

	// Only timing is set inline; the keyframe itself is referenced through a
	// scoped class below so Svelte can match its (scoped) @keyframes name.
	$: rootStyle =
		tileBgStyle +
		(idleFloat ? `animation-duration:${floatDuration}s;animation-delay:${floatDelay}s;` : '');

	$: tileBgClass = bgColor && !bgColor.startsWith('#') && bgColor.includes('bg-') ? bgColor : '';

	// --- Live tile config ----------------------------------------------------
	$: customLiveTileConfig = (() => {
		if (typeof window === 'undefined' || !item?.name) return null;
		try {
			const stored = localStorage.getItem(`ubiquity-live-tile-${item.name}`);
			if (stored) return JSON.parse(stored);
		} catch (error) {
			console.error('Error loading custom live tile config:', error);
		}
		return null;
	})();

	$: customLiveTileHTML = (() => {
		if (!customLiveTileConfig || !item?.size) return null;
		const sizeKey = item.size === '4x2' ? 'tile4x2' : 'tile2x2';
		const html = customLiveTileConfig[sizeKey];
		return html && html.trim() ? html.trim() : null;
	})();

	$: customAutoTileFlip = customLiveTileConfig?.autoTileFlip || false;

	$: shouldShowLiveTile = (() => {
		if (!item?.name) return false;
		if (item.size !== '2x2' && item.size !== '4x2') return false;
		if (editMode) return false;
		if (customLiveTileHTML) return true;
		if (item.src) {
			return (
				item.src === '/clock' ||
				item.src === '/weather' ||
				item.src === '/photos' ||
				item.src === '/music' ||
				item.src === '/spotify' ||
				item.src === '/ytmusic'
			);
		}
		return false;
	})();

	$: LiveComponent = (() => {
		if (!shouldShowLiveTile) return null;
		if (customLiveTileHTML) return null;
		if (item.src === '/clock') return LiveClock;
		if (item.src === '/weather') return LiveWeather;
		if (item.src === '/photos') return LivePhotos;
		if (item.src === '/music') return LiveMusic;
		if (item.src === '/spotify') return LiveSpotify;
		if (item.src === '/ytmusic') return LiveYTMusic;
		return null;
	})();

	$: shouldShowFlipAnimation = (() => {
		if (!shouldShowLiveTile || editMode) return false;
		if (customLiveTileHTML) return customAutoTileFlip;
		if (LiveComponent) return item.src !== '/music' && item.src !== '/photos';
		return false;
	})();

	function startRandomFlipAnimation() {
		if (!shouldShowFlipAnimation) return;
		const delay = 3000 + Math.random() * 7000;
		flipAnimationTimer = setTimeout(() => {
			flipDirection = Math.random() > 0.5 ? 'up' : 'down';
			isFlipping = true;
			setTimeout(() => {
				setTimeout(() => {
					isFlipping = false;
					startRandomFlipAnimation();
				}, 1000);
			}, 800);
		}, delay);
	}

	$: if (shouldShowFlipAnimation) {
		if (flipAnimationTimer) {
			clearTimeout(flipAnimationTimer);
			flipAnimationTimer = null;
		}
		startRandomFlipAnimation();
	}

	onDestroy(() => {
		if (flipAnimationTimer) {
			clearTimeout(flipAnimationTimer);
			flipAnimationTimer = null;
		}
	});
</script>

<div
	class="grid-item relative w-full h-full {useBlackText ? 'text-black' : 'text-white'} {tileBgClass}"
	class:dragging={isDragging}
	class:selected-lift={editMode && isSelected && !isDragging}
	class:removing={isRemoving}
	class:float-edit-1={idleFloat && floatPattern === 1}
	class:float-edit-2={idleFloat && floatPattern === 2}
	class:float-edit-3={idleFloat && floatPattern === 3}
	class:float-edit-4={idleFloat && floatPattern === 4}
	data-item-id={item.id}
	style={rootStyle}
>
	{#if shouldShowLiveTile && (LiveComponent || customLiveTileHTML)}
		<!-- Live Tile Content -->
		<div class="relative w-full h-full overflow-hidden live-tile-wrapper" style="background:#000000;">
			<div
				class="live-tile-container w-full h-full"
				class:flip-up={isFlipping && flipDirection === 'up'}
				class:flip-down={isFlipping && flipDirection === 'down'}
			>
				<div class="live-tile-front absolute inset-0 w-full h-full">
					{#if customLiveTileHTML}
						<div class="w-full h-full custom-live-tile">
							{@html customLiveTileHTML}
						</div>
					{:else if LiveComponent}
						<svelte:component this={LiveComponent} gridSize={item.size} />
					{/if}
				</div>

				<div
					class="live-tile-back absolute inset-0 w-full h-full flex flex-col items-center justify-center"
					style="background:{bgColor && bgColor.startsWith('#') ? bgColor : bgColor || accentColor};"
				>
					<div class="flex flex-col items-center justify-center gap-2">
						<div class="icon-container">
							{#if iconSrc}
								<img
									src={iconSrc}
									alt={`${item.name} icon`}
									class="w-12 h-12 object-contain"
									on:error={(e) => {
										e.target.style.display = 'none';
										const iconElement = e.target.nextElementSibling;
										if (iconElement) iconElement.style.display = 'block';
									}}
								/>
								<Icon icon={item.icon} width="48" height="48" style="display:none;" />
							{:else}
								<Icon
									icon={item.icon}
									width="48"
									height="48"
									class={item.isSystemApp ? 'text-white' : useBlackText ? 'text-black' : 'text-white'}
								/>
							{/if}
						</div>
						<span
							class="absolute bottom-2 left-2 text-base font-medium {useBlackText ? 'text-black' : 'text-white'}"
						>
							{item.name}
						</span>
					</div>
				</div>
			</div>
		</div>
	{:else}
		<!-- Regular Tile Content -->
		<div class="relative flex flex-col items-center justify-center w-full h-full p-2">
			<div class="flex flex-col items-center justify-center h-full w-full">
				<div
					class="icon-container"
					style="transform:scale({editMode ? '0.78' : '1'});transition:transform 200ms ease-in-out;"
				>
					{#if iconSrc}
						<img
							src={iconSrc}
							alt={`${item.name} icon`}
							class="w-12 h-12 object-contain"
							on:error={(e) => {
								e.target.style.display = 'none';
								const iconElement = e.target.nextElementSibling;
								if (iconElement) iconElement.style.display = 'block';
							}}
						/>
						<Icon icon={item.icon} width="48" height="48" style="display:none;" />
					{:else}
						<Icon
							icon={item.icon}
							width="48"
							height="48"
							class={item.isSystemApp ? 'text-white' : useBlackText ? 'text-black' : 'text-white'}
						/>
					{/if}
				</div>
				{#if item.size !== '1x1'}
					<span class="absolute bottom-2 left-2 text-sm mt-2 font-medium">{item.name}</span>
				{/if}
			</div>
		</div>
	{/if}

	<!-- Edit mode controls - only for the selected tile -->
	{#if editMode && isSelected && !isDragging}
		<button
			class="tile-control absolute -top-2 -right-2 w-8 h-8 {bgClass} border-2 {borderClass} rounded-full flex items-center justify-center {textColorClass} z-20"
			on:pointerdown|stopPropagation
			on:click={handleRemove}
			aria-label="Unpin tile"
		>
			<Icon icon="ri:unpin-fill" width="18" height="18" />
		</button>

		<button
			class="tile-control absolute -bottom-2 -right-2 w-8 h-8 {bgClass} border-2 {borderClass} rounded-full flex items-center justify-center {textColorClass} z-20"
			on:pointerdown|stopPropagation
			on:click={handleResize}
			aria-label="Resize tile"
		>
			<Icon
				icon="subway:left-arrow"
				width="18"
				height="18"
				style="transform:{item.size === '1x1' || item.size === '2x2' ? 'rotate(225deg)' : 'rotate(0deg)'}"
			/>
		</button>
	{/if}
</div>

<style>
	.grid-item {
		box-sizing: border-box;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		overflow: visible;
		background-image: none !important;
		border-radius: 0 !important;
		-webkit-user-select: none;
		user-select: none;
		-moz-user-select: none;
		-ms-user-select: none;
		-webkit-touch-callout: none;
	}

	/* Subtle press feedback (WP tiles dip slightly when tapped). */
	.grid-item:not(.dragging):active {
		filter: brightness(0.92);
	}

	/* Selected tile in edit mode lifts slightly above the others. */
	.grid-item.selected-lift {
		transform: scale(1.04);
		transition: transform 0.2s ease;
		z-index: 2;
	}

	/* Tile shrinking away when unpinned. */
	.grid-item.removing {
		animation: tile-removal 0.22s ease-in forwards;
		pointer-events: none;
	}

	@keyframes tile-removal {
		from {
			transform: scale(1);
			opacity: 1;
		}
		to {
			transform: scale(0);
			opacity: 0;
		}
	}

	/* Idle "breathing" float patterns for unselected tiles while reordering.
	   Referenced through the .float-edit-* classes below (not inline styles)
	   so Svelte links the scoped @keyframes name correctly. */
	@keyframes float-edit-1 {
		0%, 100% { transform: translate(0px, 0px); }
		25% { transform: translate(5px, -8px); }
		50% { transform: translate(-6px, -3px); }
		75% { transform: translate(3px, -6px); }
	}

	@keyframes float-edit-2 {
		0%, 100% { transform: translate(0px, 0px); }
		20% { transform: translate(-4px, -6px); }
		40% { transform: translate(7px, -2px); }
		60% { transform: translate(-2px, -9px); }
		80% { transform: translate(5px, -4px); }
	}

	@keyframes float-edit-3 {
		0%, 100% { transform: translate(0px, 0px); }
		30% { transform: translate(8px, -5px); }
		60% { transform: translate(-3px, -7px); }
		90% { transform: translate(6px, -2px); }
	}

	@keyframes float-edit-4 {
		0%, 100% { transform: translate(0px, 0px); }
		15% { transform: translate(-7px, -4px); }
		35% { transform: translate(4px, -8px); }
		55% { transform: translate(-5px, -1px); }
		75% { transform: translate(2px, -6px); }
		95% { transform: translate(-8px, -3px); }
	}

	.float-edit-1 {
		animation: float-edit-1 ease-in-out infinite;
	}

	.float-edit-2 {
		animation: float-edit-2 ease-in-out infinite;
	}

	.float-edit-3 {
		animation: float-edit-3 ease-in-out infinite;
	}

	.float-edit-4 {
		animation: float-edit-4 ease-in-out infinite;
	}

	.tile-control {
		font-size: 0.75rem;
		font-weight: 700;
	}

	/* Live tile flip animations */
	.live-tile-wrapper {
		perspective: 1000px;
		-webkit-perspective: 1000px;
		transform-style: preserve-3d;
		-webkit-transform-style: preserve-3d;
	}

	.live-tile-container {
		position: relative;
		width: 100%;
		height: 100%;
		transform-style: preserve-3d;
		-webkit-transform-style: preserve-3d;
		transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1);
		transform-origin: center center;
	}

	.live-tile-front,
	.live-tile-back {
		position: absolute;
		width: 100%;
		height: 100%;
		top: 0;
		left: 0;
		backface-visibility: hidden;
		-webkit-backface-visibility: hidden;
		transform-style: preserve-3d;
		-webkit-transform-style: preserve-3d;
	}

	.live-tile-front {
		transform: rotateX(0deg) translateZ(0);
		-webkit-transform: rotateX(0deg) translateZ(0);
	}

	.live-tile-back {
		transform: rotateX(180deg) translateZ(0);
		-webkit-transform: rotateX(180deg) translateZ(0);
	}

	.live-tile-container.flip-up {
		transform: rotateX(-180deg);
		-webkit-transform: rotateX(-180deg);
	}

	.live-tile-container.flip-down {
		transform: rotateX(180deg);
		-webkit-transform: rotateX(180deg);
	}
</style>
