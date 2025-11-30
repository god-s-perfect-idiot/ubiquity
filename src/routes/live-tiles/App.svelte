<script>
	import Icon from '@iconify/svelte';
	import { borderColorClassStore, accentColorStore } from '../../utils/theme';
	import Switch from '../../components/Switch.svelte';
	import Button from '../../components/Button.svelte';
	import Browse from './Browse.svelte';
	import { onMount, onDestroy, tick } from 'svelte';
	import { addToast } from '../../store/toast';
	import { browser } from '$app/environment';
	import { appInfoStore } from '../../store/appInfo';

	export let app = null;
	export let isExiting = false;
	export let onBack = () => {};

	// Expose publish function for parent component
	export function publish() {
		return publishLiveTile();
	}

	// Expose browse state and exit browse function for parent component
	export function exitBrowse() {
		if (showBrowse) {
			showBrowse = false;
		}
	}

	// User ID for ownership - generate or retrieve from localStorage
	function getUserId() {
		if (!browser) return 'anonymous';
		let userId = localStorage.getItem('ubiquity-user-id');
		if (!userId) {
			userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
			localStorage.setItem('ubiquity-user-id', userId);
		}
		return userId;
	}

	function getUserName() {
		if (!browser) return 'Anonymous';
		return localStorage.getItem('ubiquity-user-name') || 'Anonymous';
	}

	$: borderClass = $borderColorClassStore;
	$: accentColor = $accentColorStore;

	const STORAGE_KEY_PREFIX = 'ubiquity-live-tile-';

	// Get app info for preview
	$: appInfo = app
		? appInfoStore.getAppInfo(app.name) ||
			appInfoStore.getAppInfo(app.content) ||
			appInfoStore.getAppInfo(app.url) ||
			{}
		: {};
	$: appBgColor = appInfo?.bgColor || appInfo?.backgroundColor || app?.bgColor || accentColor;
	$: appIcon = appInfo?.icon || app?.icon || null;

	let tile4x2 = '';
	let tile2x2 = '';
	let autoTileFlip = false;
	export let showBrowse = false;
	let isPublishing = false;

	// Preview flip animation state
	let isFlipping4x2 = false;
	let isFlipping2x2 = false;
	let flipDirection4x2 = 'up';
	let flipDirection2x2 = 'up';
	let flipTimer4x2 = null;
	let flipTimer2x2 = null;

	// Tile dimensions (based on ~90px per row/column for 4-column grid)
	const TILE_ROW_HEIGHT = 90;
	const TILE_COL_WIDTH = 90;

	// Calculate preview dimensions - use true size or slightly scaled for better visibility
	// True size: 360px x 180px (4x2) and 180px x 180px (2x2)
	const PREVIEW_SCALE = 1.0; // Use true size (100%) for accurate preview
	const PREVIEW_4X2_WIDTH = TILE_COL_WIDTH * 4 * PREVIEW_SCALE; // 360px
	const PREVIEW_4X2_HEIGHT = TILE_ROW_HEIGHT * 2 * PREVIEW_SCALE; // 180px
	const PREVIEW_2X2_WIDTH = TILE_COL_WIDTH * 2 * PREVIEW_SCALE; // 180px
	const PREVIEW_2X2_HEIGHT = TILE_ROW_HEIGHT * 2 * PREVIEW_SCALE; // 180px

	// Start flip animation for previews
	function startPreviewFlipAnimation(is4x2 = true) {
		if (!autoTileFlip) return;

		// Clear existing timer
		if (is4x2) {
			if (flipTimer4x2) {
				clearTimeout(flipTimer4x2);
				flipTimer4x2 = null;
			}
		} else {
			if (flipTimer2x2) {
				clearTimeout(flipTimer2x2);
				flipTimer2x2 = null;
			}
		}

		// Random delay between 1-3 seconds (faster for preview to see it quickly)
		const delay = 1000 + Math.random() * 2000;

		const timer = setTimeout(() => {
			// Randomly choose flip direction
			const direction = Math.random() > 0.5 ? 'up' : 'down';

			if (is4x2) {
				flipDirection4x2 = direction;
				isFlipping4x2 = true;
			} else {
				flipDirection2x2 = direction;
				isFlipping2x2 = true;
			}

			// After 0.8s (flip animation), show back for 1s, then flip back
			setTimeout(() => {
				setTimeout(() => {
					// Flip back to front
					if (is4x2) {
						isFlipping4x2 = false;
					} else {
						isFlipping2x2 = false;
					}
					// Schedule next animation
					startPreviewFlipAnimation(is4x2);
				}, 1000);
			}, 800);
		}, delay);

		if (is4x2) {
			flipTimer4x2 = timer;
		} else {
			flipTimer2x2 = timer;
		}
	}

	// Get storage key for this app
	$: storageKey = app ? `${STORAGE_KEY_PREFIX}${app.name}` : null;

	function loadTileConfig() {
		if (!browser || !storageKey) return;

		try {
			const stored = localStorage.getItem(storageKey);
			if (stored) {
				const config = JSON.parse(stored);

				// Set the values - this will trigger reactive statements
				tile4x2 = config.tile4x2 || '';
				tile2x2 = config.tile2x2 || '';
				autoTileFlip = config.autoTileFlip || false;

				// Explicitly trigger animation checks after loading
				tick().then(() => {
					checkAndStart4x2Animation();
					checkAndStart2x2Animation();
				});
			}
		} catch (error) {
			console.error('Error loading live tile config:', error);
		}
	}

	function saveTileConfig() {
		if (!browser || !storageKey) return;

		try {
			const config = {
				tile4x2: tile4x2.trim(),
				tile2x2: tile2x2.trim(),
				autoTileFlip: autoTileFlip
			};

			localStorage.setItem(storageKey, JSON.stringify(config));
			addToast('Live tile configuration saved');
		} catch (error) {
			console.error('Error saving live tile config:', error);
			addToast('Error saving configuration');
		}
	}

	function copyLiveTileGeneratorScript() {
		const prompt = `You are an expert web developer specializing in creating beautiful, production-ready live tile designs following STRICT Metro UI (Windows Phone 8.1 / Windows 8) design guidelines. Your task is to generate HTML code for live tiles that will be displayed in an app launcher interface.

CRITICAL METRO UI DESIGN REQUIREMENTS (MUST FOLLOW):

1. SIMPLICITY & BALANCE (HIGHEST PRIORITY):
   - DO NOT overcrowd tiles with too many UI elements
   - Keep designs clean and organized - show 2-5 key pieces of information
   - Avoid cramming multiple sections, borders, or decorative elements
   - White space is your friend - use generous breathing room between elements
   - Each tile should feel spacious and organized, not busy or overwhelming
   - Organize information in clear sections with visual hierarchy
   - Use consistent spacing and alignment to create structure
   - When in doubt, reduce clutter rather than add elements

2. FLAT DESIGN PRINCIPLES:
   - Use solid, vibrant background colors - NO gradients (use solid colors like bg-blue-600, bg-green-600, etc.)
   - NO rounded corners - all elements should have sharp, square edges (no rounded-lg, rounded-full, etc.)
   - NO shadows or drop shadows - flat, clean surfaces only
   - NO bevels, embossed effects, or 3D styling
   - NO decorative borders or dividers unless absolutely necessary

3. TYPOGRAPHY (Metro UI Typography System):
   - Use LARGE, BOLD, readable fonts - Metro UI emphasizes readability
   - Primary content should use text-4xl, text-5xl, or text-6xl for important numbers/text
   - Use font-bold or font-semibold for emphasis
   - Text should be WHITE on colored backgrounds for maximum contrast
   - Use clear hierarchy: ONE large number/text, ONE medium label, optionally ONE small detail
   - Avoid using more than 2-3 different font sizes in a single tile

4. LAYOUT & SPACING:
   - Content-first approach - prioritize showing information over decoration
   - Use generous padding (p-4, p-6, p-8) - give content room to breathe
   - Align content to grid - use flexbox with clear, simple alignment
   - For 4x2 tiles: Use horizontal layouts with 1-2 clear sections MAX
   - For 2x2 tiles: Focus on ONE piece of information centered or top-left aligned
   - Avoid creating multiple columns or complex grid structures
   - Keep spacing consistent and generous

5. COLOR PALETTE (Metro UI Colors):
   - Use ONE vibrant, saturated color as the background (blue-600, green-600, purple-600, etc.)
   - Solid backgrounds only - NO gradients: use bg-blue-600 NOT bg-gradient-to-br
   - White text on colored backgrounds: text-white
   - Consider using darker shades (600-800 range) for better text contrast
   - Avoid using multiple background colors in a single tile

6. CONTENT DESIGN:
   - Information-dense but NOT cluttered - this is the key balance
   - Show real, useful data (not placeholders) organized clearly
   - Use icons sparingly - prefer large numbers and text for primary information
   - Icons work well for secondary information (humidity, wind, etc.)
   - For 4x2: Show 3-6 key data points organized in clear sections
   - For 2x2: Show 2-4 key pieces of information with clear hierarchy
   - Organize information spatially - use left/right, top/bottom sections
   - Primary information should be largest, secondary information smaller

7. WHAT TO AVOID:
   - Multiple borders or dividers
   - Too many text elements competing for attention
   - Complex layouts with many sections
   - Decorative elements that don't serve a functional purpose
   - Icons that are unnecessary or redundant with text
   - Multiple colors or patterns
   - Dense information grids

TECHNICAL REQUIREMENTS:
1. Generate TWO versions of the live tile HTML:
   - A 4x2 tile (wide format, approximately 360px × 180px)
   - A 2x2 tile (square format, approximately 180px × 180px)

2. Use Tailwind CSS classes exclusively - no inline styles or custom CSS. All classes must be Tailwind utility classes.

3. The HTML must be self-contained and ready to use - just copy and paste the code directly.

4. The HTML will be rendered inside a container that is 100% width and height, so use w-full and h-full classes.

5. You can use subtle animations using Tailwind's animate utilities, but keep them minimal and purposeful.

6. Make the text purposeful and useful. Don't use random numbers or text. If you are showing something, use js to fetch the data from some API. If not, use meaningful static text.

CONTENT BY APP TYPE (Balance detail with clarity):
- Weather apps: Show temperature (LARGE), condition, location, and optional forecast/high-low. For 4x2, can include humidity/pressure/wind.
- News apps: Show headline and optionally source or time
- Social apps: Show notification count (LARGE) and optionally recent activity preview
- Productivity apps: Show key metrics (task count, completion status, deadlines)
- Music apps: Show current track, artist, and optionally album art or controls
- Calendar apps: Show current date (LARGE), day name, and optionally upcoming events
- Finance apps: Show key metrics (balance, price, change) with clear labels
- Fitness apps: Show steps/progress (LARGE) and optionally goal or achievement
- General: Show 2-5 key pieces of information, organized clearly with hierarchy

EXAMPLE FORMAT (Following Metro UI - Based on existing system tiles):

Here's an example for a Weather app matching the complexity of existing system tiles:

4x2 TILE (Weather - matches system design):
<div class="w-full h-full bg-blue-600 flex flex-row justify-between text-white p-4">
  <div class="flex flex-col justify-between h-full">
    <div class="flex flex-col">
      <span class="text-lg font-[400]">New York</span>
      <span class="text-sm font-[300] opacity-80">Updated: 2:30 PM</span>
    </div>
    <div class="flex flex-col">
      <div class="flex items-baseline gap-2">
        <span class="text-6xl font-[300]">72</span>
        <span class="text-base font-[500]">°F</span>
      </div>
      <span class="text-base font-[300] capitalize">Sunny</span>
    </div>
  </div>
  <div class="flex flex-col gap-2 items-end justify-center">
    <div class="flex items-center gap-2">
      <span class="text-base">☁️</span>
      <span class="text-base font-[300]">60%</span>
    </div>
    <div class="flex items-center gap-2">
      <span class="text-base">💨</span>
      <span class="text-base font-[300]">12 km/h</span>
    </div>
  </div>
</div>

2x2 TILE (Weather - compact but informative):
<div class="w-full h-full bg-blue-600 flex flex-col justify-between text-white p-2">
  <div class="flex flex-col">
    <span class="text-lg font-[500]">New York</span>
    <span class="text-sm font-[300] capitalize opacity-90">Sunny</span>
  </div>
  <div class="flex items-baseline gap-2">
    <span class="text-6xl font-[300]">72</span>
    <span class="text-base font-[500]">°F</span>
  </div>
  <div class="flex items-center gap-2">
    <span class="text-base font-[300]">75°</span>
    <div class="w-6 h-px bg-white opacity-50"></div>
    <span class="text-base font-[300] opacity-80">68°</span>
  </div>
</div>

Here's an example for a Clock app (based on system implementation):

4x2 TILE (Clock):
<div class="w-full h-full flex flex-col justify-center items-start text-white p-4" style="background-color: #4c1d95;">
  <div class="flex items-center gap-2">
    <span class="text-7xl font-[200]">12</span>
    <span class="text-7xl font-[200]">:</span>
    <span class="text-7xl font-[200]">45</span>
    <span class="text-4xl font-[200] ml-2">PM</span>
  </div>
  <div class="flex flex-col absolute bottom-1 left-1">
    <span class="text-base font-[500]">Monday</span>
    <span class="text-base font-[300]">January 15, 2024</span>
  </div>
</div>

2x2 TILE (Clock):
<div class="w-full h-full flex flex-col justify-center items-center text-white p-4" style="background-color: #4c1d95;">
  <div class="flex flex-row items-baseline gap-1 text-6xl font-[200]">
    <span>12</span>
    <span>:</span>
    <span>45</span>
  </div>
  <span class="text-base font-[300] mb-4">PM</span>
  <div class="flex flex-col items-start w-full absolute bottom-1 left-1">
    <span class="text-base font-[500]">Monday</span>
    <span class="text-base font-[300]">Jan 15, 2024</span>
  </div>
</div>

DESIGN PHILOSOPHY REMINDER:
- Metro UI is about CONTENT, not decoration
- Every element must serve a clear purpose
- When in doubt, simplify - remove elements rather than add
- The tile should be readable at a glance
- Clarity over complexity
- Space is a design element - use it generously

IMPORTANT: Follow Metro UI guidelines STRICTLY:
- Solid colors, no gradients
- No rounded corners
- No shadows
- Large, bold typography
- White text on colored backgrounds
- Content-first, SIMPLE design
- Clean, flat, modern aesthetic
- Left alignment preferred over center alignment
- DO NOT overcrowd - simplicity is key

Now, please generate production-ready HTML code following these Metro UI guidelines for the following app:

APP NAME: ${app?.name || 'My App'}

APP DESCRIPTION: ${app?.description || 'A useful application'}

Remember: Create tiles that are SIMPLE, CLEAN, and UNCLUTTERED. Focus on ONE to THREE key pieces of information maximum. When in doubt, remove elements rather than add them.

Please provide both the 4x2 and 2x2 tile HTML code. Make sure it strictly follows Metro UI design principles, uses only Tailwind CSS classes, and is production-ready.`;

		navigator.clipboard.writeText(prompt);
		addToast('Live tile generator prompt copied to clipboard');
	}

	async function publishLiveTile() {
		console.log('publishLiveTile called', { app, hasTile4x2: !!tile4x2.trim(), hasTile2x2: !!tile2x2.trim() });
		
		if (!app) {
			addToast('No app selected');
			return { success: false, error: 'No app selected' };
		}
		
		if (!tile4x2.trim()) {
			addToast('Please create a 4x2 tile before publishing');
			return { success: false, error: 'Missing 4x2 tile' };
		}
		
		if (!tile2x2.trim()) {
			addToast('Please create a 2x2 tile before publishing');
			return { success: false, error: 'Missing 2x2 tile' };
		}

		const appUrl = app.url || app.content || '';
		if (!appUrl) {
			addToast('App URL is required to publish');
			isPublishing = false;
			return { success: false, error: 'Missing app URL' };
		}

		isPublishing = true;
		try {
			const tileData = {
				appUrl: appUrl,
				appName: app.name || '',
				tile4x2: tile4x2.trim(),
				tile2x2: tile2x2.trim(),
				autoTileFlip: autoTileFlip,
				owner: getUserName(),
				ownerId: getUserId(),
				description: ''
			};
			
			console.log('Publishing tile:', tileData);

			const response = await fetch('/api/livetiles', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(tileData)
			});

			const data = await response.json();

			if (data.success) {
				addToast('Live tile published successfully!');
				return { success: true, tileId: data.tileId };
			} else {
				throw new Error(data.error || 'Failed to publish live tile');
			}
		} catch (error) {
			console.error('Error publishing live tile:', error);
			addToast('Failed to publish live tile: ' + (error.message || 'Unknown error'));
			return { success: false, error: error.message || 'Unknown error' };
		} finally {
			isPublishing = false;
		}
	}

	function handleBrowse() {
		showBrowse = true;
	}

	function handleBrowseBack() {
		showBrowse = false;
	}

	function handleTileSelect(selectedTile) {
		if (selectedTile) {
			tile4x2 = selectedTile.tile4x2 || '';
			tile2x2 = selectedTile.tile2x2 || '';
			autoTileFlip = selectedTile.autoTileFlip || false;
			showBrowse = false;
			addToast('Live tile loaded!');

			// Save the loaded tile config
			tick().then(() => {
				saveTileConfig();
				checkAndStart4x2Animation();
				checkAndStart2x2Animation();
			});
		}
	}

	// Simple check: if we should animate and timer is not running, start it
	function checkAndStart4x2Animation() {
		const shouldAnimate = autoTileFlip && tile4x2.trim();

		if (shouldAnimate && !flipTimer4x2) {
			// We should animate but timer is not running - start it
			tick().then(() => {
				startPreviewFlipAnimation(true);
			});
		} else if (!shouldAnimate && flipTimer4x2) {
			// We should not animate but timer is running - stop it
			clearTimeout(flipTimer4x2);
			flipTimer4x2 = null;
			isFlipping4x2 = false;
		}
	}

	function checkAndStart2x2Animation() {
		const shouldAnimate = autoTileFlip && tile2x2.trim();

		if (shouldAnimate && !flipTimer2x2) {
			// We should animate but timer is not running - start it
			tick().then(() => {
				startPreviewFlipAnimation(false);
			});
		} else if (!shouldAnimate && flipTimer2x2) {
			// We should not animate but timer is running - stop it
			clearTimeout(flipTimer2x2);
			flipTimer2x2 = null;
			isFlipping2x2 = false;
		}
	}

	// Reactive statements to trigger animations whenever values change
	$: (autoTileFlip, tile4x2, checkAndStart4x2Animation());

	$: (autoTileFlip, tile2x2, checkAndStart2x2Animation());

	// Load config when app changes
	$: if (storageKey) {
		loadTileConfig();
	}

	onMount(() => {
		if (storageKey) {
			loadTileConfig();
		}

		// Ensure animations start after a short delay to allow everything to initialize
		setTimeout(() => {
			checkAndStart4x2Animation();
			checkAndStart2x2Animation();
		}, 100);
	});

	onDestroy(() => {
		if (flipTimer4x2) {
			clearTimeout(flipTimer4x2);
		}
		if (flipTimer2x2) {
			clearTimeout(flipTimer2x2);
		}
	});
</script>

<div class="page-holder">
	{#if showBrowse && app}
		<Browse {app} {isExiting} onBack={handleBrowseBack} onSelect={handleTileSelect} />
	{:else}
		<div class="page pt-4 flex flex-col h-screen overflow-y-auto" class:page-exit={isExiting}>
			{#if app}
			<span class="text-6xl font-[300] truncate lowercase pb-8 h-auto px-4">{app.name}</span>

			<div class="flex flex-col gap-6 flex-1 overflow-y-auto pb-24 px-4">
				<span class="text-base font-[300]"
					>You can customize the live tiles for the <span style="color: {accentColor};"
						>{app.name}</span
					>
					live tile here using HTML and CSS. You can even use
					<span style="color: {accentColor};">Tailwind CSS</span> classes to style the tile. This also
					includes animations</span
				>
				<!-- 4x2 Tile Textbox -->
				<div class="flex flex-col gap-2 font-[400]">
					<label for="tile4x2" class="text-[#767676] text-sm">4x2 tile</label>
					<textarea
						id="tile4x2"
						bind:value={tile4x2}
						class="bg-[#bebebe] w-full py-2 pl-2 outline-none text-[#121212] text-base min-h-[200px] resize-y font-mono text-sm"
						placeholder="Enter HTML for 4x2 tile (Tailwind CSS classes allowed)..."
					></textarea>
					<!-- 4x2 Preview -->
					{#if tile4x2.trim()}
						<div class="flex flex-col gap-2">
							<span class="text-[#767676] text-sm">Preview</span>
							<div
								class="relative overflow-hidden"
								style="width: {PREVIEW_4X2_WIDTH}px; height: {PREVIEW_4X2_HEIGHT}px; background: #000000;"
							>
								<div
									class="live-tile-preview-container w-full h-full"
									class:flip-up={isFlipping4x2 && flipDirection4x2 === 'up'}
									class:flip-down={isFlipping4x2 && flipDirection4x2 === 'down'}
								>
									<!-- Live tile content (front) -->
									<div class="live-tile-preview-front absolute inset-0 w-full h-full">
										<div class="w-full h-full custom-live-tile">
											{@html tile4x2}
										</div>
									</div>

									<!-- App icon and name (back) - shown during flip -->
									<div
										class="live-tile-preview-back absolute inset-0 w-full h-full flex flex-col items-center justify-center"
										style="background: {appBgColor};"
									>
										<div class="flex flex-col items-center justify-center gap-2">
											{#if appIcon && (appIcon.startsWith('http://') || appIcon.startsWith('https://'))}
												<img src={appIcon} alt="{app.name} icon" class="w-8 h-8 object-contain" />
											{:else if appIcon}
												<Icon icon={appIcon} width="16" height="16" class="text-white" />
											{/if}
											<span class="text-base font-medium text-white absolute bottom-2 left-2"
												>{app.name}</span
											>
										</div>
									</div>
								</div>
							</div>
						</div>
					{/if}
				</div>

				<!-- 2x2 Tile Textbox -->
				<div class="flex flex-col gap-2 font-[400]">
					<label for="tile2x2" class="text-[#767676] text-sm">2x2 tile</label>
					<textarea
						id="tile2x2"
						bind:value={tile2x2}
						class="bg-[#bebebe] w-full py-2 pl-2 outline-none text-[#121212] text-base min-h-[200px] resize-y font-mono text-sm"
						placeholder="Enter HTML for 2x2 tile (Tailwind CSS classes allowed)..."
					></textarea>
					<!-- 2x2 Preview -->
					{#if tile2x2.trim()}
						<div class="flex flex-col gap-2">
							<span class="text-[#767676] text-sm">Preview</span>
							<div
								class="relative overflow-hidden"
								style="width: {PREVIEW_2X2_WIDTH}px; height: {PREVIEW_2X2_HEIGHT}px; background: #000000;"
							>
								<div
									class="live-tile-preview-container w-full h-full"
									class:flip-up={isFlipping2x2 && flipDirection2x2 === 'up'}
									class:flip-down={isFlipping2x2 && flipDirection2x2 === 'down'}
								>
									<!-- Live tile content (front) -->
									<div class="live-tile-preview-front absolute inset-0 w-full h-full">
										<div class="w-full h-full custom-live-tile">
											{@html tile2x2}
										</div>
									</div>

									<!-- App icon and name (back) - shown during flip -->
									<div
										class="live-tile-preview-back absolute inset-0 w-full h-full flex flex-col items-center justify-center"
										style="background: {appBgColor};"
									>
										<div class="flex flex-col items-center justify-center gap-2">
											{#if appIcon && (appIcon.startsWith('http://') || appIcon.startsWith('https://'))}
												<img src={appIcon} alt="{app.name} icon" class="w-8 h-8 object-contain" />
											{:else if appIcon}
												<Icon icon={appIcon} width="16" height="16" class="text-white" />
											{/if}
											<span class="text-base font-medium text-white absolute bottom-2 left-2"
												>{app.name}</span
											>
										</div>
									</div>
								</div>
							</div>
						</div>
					{/if}
				</div>

				<!-- Auto Tile Flip Switch -->
				<Switch
					title="auto tile flip"
					description="Enable automatic tile flip animation"
					bind:value={autoTileFlip}
				/>

				<!-- Save Button -->
				<div class="flex justify-start pt-4">
					<Button text="save" onClick={saveTileConfig} />
				</div>

				<div class="flex flex-col gap-4 pt-4">
					<span class="text-base font-[300] text-[#767676]"
						>Not a developer? Just use the <span style="color: {accentColor};"
							>Live Tile Generator Script</span
						> to create a live tile for your app using ChatGPT. You can also browse custom Live tiles
						published by other users.</span
					>
					<Button text="copy live tile generator script" onClick={copyLiveTileGeneratorScript} />
					<Button text="browse live tiles" onClick={handleBrowse} />
				</div>
			</div>
			{:else}
				<span class="text-6xl font-[300]">No app selected</span>
			{/if}
		</div>
	{/if}
</div>

<style>
	.live-tile-preview-container {
		position: relative;
		width: 100%;
		height: 100%;
		transform-style: preserve-3d;
		-webkit-transform-style: preserve-3d;
		transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1);
		transform-origin: center center;
	}

	.live-tile-preview-front,
	.live-tile-preview-back {
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

	.live-tile-preview-front {
		transform: rotateX(0deg) translateZ(0);
		-webkit-transform: rotateX(0deg) translateZ(0);
	}

	.live-tile-preview-back {
		transform: rotateX(180deg) translateZ(0);
		-webkit-transform: rotateX(180deg) translateZ(0);
	}

	/* Flip up animation */
	.live-tile-preview-container.flip-up {
		transform: rotateX(-180deg);
		-webkit-transform: rotateX(-180deg);
	}

	/* Flip down animation */
	.live-tile-preview-container.flip-down {
		transform: rotateX(180deg);
		-webkit-transform: rotateX(180deg);
	}
</style>
