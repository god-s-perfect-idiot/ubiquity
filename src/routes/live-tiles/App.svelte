<script>
	import Icon from '@iconify/svelte';
	import { borderColorClassStore, accentColorStore } from '../../utils/theme';
	import Switch from '../../components/Switch.svelte';
	import Button from '../../components/Button.svelte';
	import { onMount, onDestroy, tick } from 'svelte';
	import { addToast } from '../../store/toast';
	import { browser } from '$app/environment';
	import { appInfoStore } from '../../store/appInfo';

	export let app = null;
	export let isExiting = false;
	export let onBack = () => {};

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
			addToast('Error saving configuration', 'error');
		}
	}

	function copyLiveTileGeneratorScript() {
		const prompt = `You are an expert web developer specializing in creating beautiful, production-ready live tile designs following STRICT Metro UI (Windows Phone 8.1 / Windows 8) design guidelines. Your task is to generate HTML code for live tiles that will be displayed in an app launcher interface.

CRITICAL METRO UI DESIGN REQUIREMENTS (MUST FOLLOW):
1. FLAT DESIGN PRINCIPLES:
   - Use solid, vibrant background colors - NO gradients (use solid colors like bg-blue-600, bg-green-600, etc.)
   - NO rounded corners - all elements should have sharp, square edges (no rounded-lg, rounded-full, etc.)
   - NO shadows or drop shadows - flat, clean surfaces only
   - NO bevels, embossed effects, or 3D styling

2. TYPOGRAPHY (Metro UI Typography System):
   - Use LARGE, BOLD, readable fonts - Metro UI emphasizes readability
   - Primary content should use text-4xl, text-5xl, or text-6xl for important numbers/text
   - Use font-bold or font-semibold for emphasis
   - Text should be WHITE on colored backgrounds for maximum contrast
   - Use clear hierarchy: large numbers/stats, medium labels, small details

3. LAYOUT & SPACING:
   - Content-first approach - prioritize showing information over decoration
   - Use generous padding (p-4, p-6) but keep it structured
   - Align content to grid - use flexbox with clear alignment
   - For 4x2 tiles: Use horizontal layouts with clear sections
   - For 2x2 tiles: Use centered, vertical layouts

4. COLOR PALETTE (Metro UI Colors):
   - Use vibrant, saturated colors from Tailwind's palette (blue-600, green-600, purple-600, etc.)
   - Solid backgrounds only - NO gradients: use bg-blue-600 NOT bg-gradient-to-br
   - White text on colored backgrounds: text-white
   - Consider using darker shades (600-800 range) for better text contrast

5. CONTENT DESIGN:
   - Information-dense but not cluttered
   - Show real, useful data (not placeholders)
   - Use icons sparingly - prefer large numbers and text
   - For 4x2: Show multiple data points or a horizontal layout
   - For 2x2: Focus on one or two key pieces of information

TECHNICAL REQUIREMENTS:
1. Generate TWO versions of the live tile HTML:
   - A 4x2 tile (wide format, approximately 360px × 180px)
   - A 2x2 tile (square format, approximately 180px × 180px)

2. Use Tailwind CSS classes exclusively - no inline styles or custom CSS. All classes must be Tailwind utility classes.

3. The HTML must be self-contained and ready to use - just copy and paste the code directly.

4. The HTML will be rendered inside a container that is 100% width and height, so use w-full and h-full classes.

5. You can use subtle animations using Tailwind's animate utilities, but keep them minimal and purposeful.

6. Make the text purposeful and useful. Dont use random numbers or text. If you are showing something, use js to fetch the data from some api. if not, use meaningful static text.

CONTENT BY APP TYPE:
- Weather apps: Show current temperature (large), condition, and forecast
- News apps: Show headlines, breaking news indicators
- Social apps: Show notification counts, recent activity
- Productivity apps: Show task counts, deadlines, stats
- Music apps: Show current track, artist name
- Calendar apps: Show current date, upcoming events
- Finance apps: Show key metrics, stock prices, balances
- Fitness apps: Show steps, goals, achievements
- And adapt accordingly for other app types...

EXAMPLE FORMAT (Following Metro UI):

Here's an example for a Weather app following Metro UI principles:

4x2 TILE:
<div class="w-full h-full bg-blue-600 flex flex-col justify-between p-6 text-white">
  <div class="flex items-start justify-between">
    <div>
      <div class="text-6xl font-bold leading-none">72°</div>
      <div class="text-xl font-semibold mt-1">Sunny</div>
    </div>
    <div class="text-6xl">☀️</div>
  </div>
  <div class="flex gap-4 text-base">
    <div class="flex-1">
      <div class="text-xs uppercase tracking-wide opacity-90">Tomorrow</div>
      <div class="text-2xl font-bold">68°</div>
    </div>
    <div class="flex-1">
      <div class="text-xs uppercase tracking-wide opacity-90">Wed</div>
      <div class="text-2xl font-bold">70°</div>
    </div>
    <div class="flex-1">
      <div class="text-xs uppercase tracking-wide opacity-90">Thu</div>
      <div class="text-2xl font-bold">74°</div>
    </div>
  </div>
</div>

2x2 TILE:
<div class="w-full h-full bg-blue-600 flex flex-col justify-center items-center p-4 text-white">
  <div class="text-6xl mb-2">☀️</div>
  <div class="text-5xl font-bold leading-none">72°</div>
  <div class="text-base font-semibold mt-1">Sunny</div>
</div>

IMPORTANT: Follow Metro UI guidelines STRICTLY:
- Solid colors, no gradients
- No rounded corners
- No shadows
- Large, bold typography
- White text on colored backgrounds
- Content-first, information-dense design
- Clean, flat, modern aesthetic
- Left Alignment over center alignment. 

Now, please generate production-ready HTML code following these Metro UI guidelines for the following app:

APP NAME: ${app?.name || 'My App'}

APP DESCRIPTION: ${app?.description || 'A useful application'}

Please provide both the 4x2 and 2x2 tile HTML code. Make sure it strictly follows Metro UI design principles, uses only Tailwind CSS classes, and is production-ready.`;

		navigator.clipboard.writeText(prompt);
		addToast('Live tile generator prompt copied to clipboard');
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
								class="relative overflow-hidden border-2 border-white"
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
								class="relative overflow-hidden border-2 border-white"
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
					<Button
						text="browse custom live tiles"
						onClick={() => {
							addToast('Coming soon. i need some coffee.');
						}}
					/>
				</div>
			</div>
		{:else}
			<span class="text-6xl font-[300]">No app selected</span>
		{/if}
	</div>
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
