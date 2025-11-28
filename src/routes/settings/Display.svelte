<script>
	import { onMount } from 'svelte';
	import { slide } from 'svelte/transition';
	import { settingsStore } from '../../store/settings';
	import Switch from '../../components/Switch.svelte';
	import Select from '../../components/Select.svelte';
	import Input from '../../components/Input.svelte';

	export let isExiting = false;

	// Font options
	const fontOptions = ['Noto Sans', 'selawik', 'selawik light'];

	let showMoreCols = false;
	let selectedFont = 'Noto Sans';
	let customFontEnabled = false;
	let customFontCdn = '';
	let customFontName = '';
	
	$: showMoreCols = settingsStore.get('appearance.showMoreCols') || false;
	
	// Get font settings from store
	$: {
		const font = settingsStore.get('appearance.font');
		selectedFont = font || 'Noto Sans';

		const customEnabled = settingsStore.get('appearance.customFontEnabled');
		customFontEnabled = customEnabled || false;

		const cdn = settingsStore.get('appearance.customFontCdn');
		customFontCdn = cdn || '';
		
		const fontName = settingsStore.get('appearance.customFontName');
		customFontName = fontName || '';
	}

	// Load custom font from CDN
	function loadCustomFont(cdnUrl, fontFamilyName) {
		if (!cdnUrl || typeof document === 'undefined') return;
		
		if (!fontFamilyName || fontFamilyName.trim() === '') {
			console.warn('Custom font name is required');
			return;
		}

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

		// Apply font to body
		if (typeof document !== 'undefined') {
			document.body.style.fontFamily = font;
		}
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
			if (typeof document !== 'undefined') {
				document.body.style.fontFamily = selectedFont;
			}
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
			// Use regular font
			const font = settingsStore.get('appearance.font') || 'Noto Sans';
			if (typeof document !== 'undefined') {
				document.body.style.fontFamily = font;
			}
		}
	});
</script>

<div class="page-holder">
	<div class="page pt-4 px-4 flex flex-col h-screen" class:page-exit={isExiting}>
		<span class="text-6xl font-[300]">display</span>
		<div class="flex flex-col gap-8 mt-8 flex-1 overflow-y-auto">
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
						Enter the exact font family name as defined in the CSS (e.g., "Segoe WP", "Roboto", "Open Sans").
					</span>
				</div>
			{/if}
			<!-- <div class="flex flex-col gap-4">
				<Switch
					title="Show More Columns"
					description="Show more columns in the start menu."
					bind:value={showMoreCols}
					onToggle={(value) => {
						settingsStore.updateSettings({ 'appearance.showMoreCols': value });
					}}
				/>
			</div> -->
		</div>
	</div>
</div>
