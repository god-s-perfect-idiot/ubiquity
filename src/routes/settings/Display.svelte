<script>
	import { onMount } from 'svelte';
	import { slide } from 'svelte/transition';
	import { settingsStore } from '../../store/settings';
	import Switch from '../../components/Switch.svelte';
	import Select from '../../components/Select.svelte';
	import Input from '../../components/Input.svelte';
	import {
		FONT_SCALE_STEPS,
		normalizeFontScale,
		scaleToStepIndex,
		stepIndexToScale
	} from '../../utils/font-scale';
	import StepSlider from '../../components/StepSlider.svelte';
	import { FONT_OPTIONS, ensureAppFontLoaded, unloadAppFont } from '../../lib/app-fonts.js';

	export let isExiting = false;

	const fontOptions = FONT_OPTIONS;

	let showMoreCols = false;
	let desktopStartMenu = false;
	let selectedFont = 'Noto Sans';
	let customFontEnabled = false;
	let customFontCdn = '';
	let customFontName = '';
	let fontScaleStep = 3;

	$: showMoreCols = $settingsStore.settings.appearance?.showMoreCols || false;
	$: desktopStartMenu = $settingsStore.settings.appearance?.desktopStartMenu || false;
	$: fontScale = normalizeFontScale(
		$settingsStore.settings.appearance?.fontScale ??
			$settingsStore.settings.appearance?.fontSize
	);
	$: fontScaleStep = scaleToStepIndex(fontScale);
	$: previewFontSize = `calc(1.5rem * ${stepIndexToScale(fontScaleStep)})`;

	// Get font settings from store
	$: {
		const appearance = $settingsStore.settings.appearance || {};
		selectedFont = appearance.font || 'Noto Sans';
		customFontEnabled = appearance.customFontEnabled || false;
		customFontCdn = appearance.customFontCdn || '';
		customFontName = appearance.customFontName || '';
	}

	function handleFontScaleStepChange(step) {
		fontScaleStep = step;
		settingsStore.set('appearance.fontScale', stepIndexToScale(step));
	}

	// Load custom font from CDN
	function loadCustomFont(cdnUrl, fontFamilyName) {
		if (!cdnUrl || typeof document === 'undefined') return;

		if (!fontFamilyName || fontFamilyName.trim() === '') {
			console.warn('Custom font name is required');
			return;
		}

		unloadAppFont();

		// Remove existing custom font link if any
		const existingLink = document.getElementById('custom-font-link');
		if (existingLink) {
			existingLink.remove();
		}

		// Create and add new link
		const link = document.createElement('link');
		link.id = 'custom-font-link';
		link.rel = 'stylesheet';
		link.href = cdnUrl;

		// Wait for stylesheet to load before applying font
		link.onload = () => {
			// Apply the font after stylesheet loads
			if (typeof document !== 'undefined') {
				document.body.style.fontFamily = `"${fontFamilyName}", sans-serif`;
			}
		};

		// Fallback: apply font immediately (in case onload doesn't fire)
		document.head.appendChild(link);
		if (typeof document !== 'undefined') {
			document.body.style.fontFamily = `"${fontFamilyName}", sans-serif`;
		}

		return fontFamilyName;
	}

	// Handle font change
	function handleFontChange(font) {
		if (customFontEnabled) return; // Don't change if custom font is enabled

		settingsStore.set('appearance.font', font);
		selectedFont = font;

		// Remove custom font link if switching to regular font
		const existingLink = document.getElementById('custom-font-link');
		if (existingLink) {
			existingLink.remove();
		}

		ensureAppFontLoaded(font);
	}

	// Handle custom font toggle
	function handleCustomFontToggle(enabled) {
		customFontEnabled = enabled;
		settingsStore.set('appearance.customFontEnabled', enabled);

		if (enabled && customFontCdn && customFontName) {
			// Load and apply custom font
			loadCustomFont(customFontCdn, customFontName);
		} else {
			// Remove custom font and revert to selected font
			const existingLink = document.getElementById('custom-font-link');
			if (existingLink) {
				existingLink.remove();
			}
			unloadAppFont();
			ensureAppFontLoaded(selectedFont);
		}
	}

	// Handle custom font CDN change (reactive)
	let lastCdnValue = '';
	let lastFontNameValue = '';
	$: {
		if (customFontCdn !== undefined && customFontCdn !== lastCdnValue) {
			lastCdnValue = customFontCdn;
			settingsStore.set('appearance.customFontCdn', customFontCdn);

			if (customFontEnabled && customFontCdn && customFontName) {
				// Load and apply the new custom font
				loadCustomFont(customFontCdn, customFontName);
			}
		}

		if (customFontName !== undefined && customFontName !== lastFontNameValue) {
			lastFontNameValue = customFontName;
			settingsStore.set('appearance.customFontName', customFontName);

			if (customFontEnabled && customFontCdn && customFontName) {
				// Load and apply the new custom font
				loadCustomFont(customFontCdn, customFontName);
			}
		}
	}

	// Apply font on mount
	onMount(() => {
		const customEnabled = settingsStore.get('appearance.customFontEnabled');
		const cdn = settingsStore.get('appearance.customFontCdn');
		const fontName = settingsStore.get('appearance.customFontName');

		if (customEnabled && cdn && fontName) {
			// Load custom font
			loadCustomFont(cdn, fontName);
		} else {
			ensureAppFontLoaded(settingsStore.get('appearance.font') || 'Noto Sans');
		}
	});
</script>

<div class="page-holder">
	<div class="page pt-4 px-4 flex flex-col h-screen" class:page-exit={isExiting}>
		<span class="text-6xl font-[300]">display</span>
		<div class="flex flex-col gap-8 mt-8 flex-1 overflow-y-auto">
			<StepSlider
				label="Text size"
				description="Changes the text size across apps, settings, lock screen, and other screens."
				previewText="Sample"
				previewFontSize={previewFontSize}
				steps={FONT_SCALE_STEPS}
				bind:value={fontScaleStep}
				on:change={(event) => handleFontScaleStepChange(event.detail)}
			/>
			<div class="flex flex-col gap-4">
				<Select
					label="Font"
					data={fontOptions}
					bind:selection={selectedFont}
					onSelectionChange={handleFontChange}
					className={customFontEnabled ? 'opacity-50' : ''}
				/>
			</div>
			<div class="flex flex-col gap-4">
				<Switch
					title="Custom Font"
					description="Enable custom font from CDN."
					bind:value={customFontEnabled}
					onToggle={handleCustomFontToggle}
				/>
			</div>
			{#if customFontEnabled}
				<div class="flex flex-col gap-4" transition:slide={{ duration: 300, axis: 'y' }}>
					<Input label="Font CDN URL" bind:content={customFontCdn} />
					<span class="text-sm font-[300] text-[#a1a1a1]">
						Enter a CDN URL for your custom font (e.g., Google Fonts CSS link).
					</span>
					<Input label="Font Family Name" bind:content={customFontName} />
					<span class="text-sm font-[300] text-[#a1a1a1]">
						Enter the exact font family name as defined in the CSS (e.g., "Segoe WP", "Roboto",
						"Open Sans").
					</span>
				</div>
			{/if}
			<div class="flex flex-col gap-4">
				<Switch
					title="Show More Columns"
					description="Show more columns in the start menu."
					bind:value={showMoreCols}
					onToggle={(value) => {
						settingsStore.updateSettings({ 'appearance.showMoreCols': value });
					}}
				/>
			</div>
			<div class="flex flex-col gap-4">
				<Switch
					title="Desktop Start Menu"
					description="Increases the number of columns in the start menu."
					bind:value={desktopStartMenu}
					onToggle={(value) => {
						settingsStore.updateSettings({ 'appearance.desktopStartMenu': value });
					}}
				/>
			</div>
		</div>
	</div>
</div>
