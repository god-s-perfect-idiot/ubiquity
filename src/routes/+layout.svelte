<script>
	import Header from './Header.svelte';
	import "../app.css"
	import Notifier from '../components/Notifier.svelte';
	import NavBar from '../components/NavBar.svelte';
	import '../kernel/debug.js';
	import { registerServiceWorker, setupInstallPrompt } from '../lib/pwa.js';
	import { onMount } from 'svelte';
	import { backgroundThemeStore, textColorClassStore } from '../utils/theme';
	import { settingsStore } from '../store/settings';

	// Get theme reactively
	$: backgroundTheme = $backgroundThemeStore;
	$: textColorClass = $textColorClassStore;
	$: bodyBgColor = backgroundTheme === 'light' ? '#ffffff' : '#000000';
	$: bodyTextColor = backgroundTheme === 'light' ? '#000000' : '#ffffff';
	$: selectedFont = settingsStore.get('appearance.font') || 'Noto Sans';
	$: customFontEnabled = settingsStore.get('appearance.customFontEnabled') || false;
	$: customFontCdn = settingsStore.get('appearance.customFontCdn') || '';
	$: customFontName = settingsStore.get('appearance.customFontName') || '';

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

		// Update body styles reactively
	$: {
		if (typeof document !== 'undefined') {
			document.body.style.backgroundColor = bodyBgColor;
			document.body.style.color = bodyTextColor;
			
			if (customFontEnabled && customFontCdn && customFontName) {
				// Load and apply custom font
				loadCustomFont(customFontCdn, customFontName);
			} else {
				// Use regular font
				document.body.style.fontFamily = selectedFont;
				
				// Remove custom font link if switching to regular font
				const existingLink = document.getElementById('custom-font-link');
				if (existingLink) {
					existingLink.remove();
				}
			}
		}
	}

	onMount(() => {
		// Register service worker
		registerServiceWorker();
		// Setup install prompt
		setupInstallPrompt();
		
		// Set initial body styles
		if (typeof document !== 'undefined') {
			document.body.style.backgroundColor = bodyBgColor;
			document.body.style.color = bodyTextColor;
			
			if (customFontEnabled && customFontCdn && customFontName) {
				// Load and apply custom font
				loadCustomFont(customFontCdn, customFontName);
			} else {
				// Use regular font
				document.body.style.fontFamily = selectedFont;
			}
		}
	});
</script>

<div class="app">
	<Notifier />
	<Header />
	<main>
		<slot />
	</main>

	<footer>
		<!-- <NavBar />	 -->
	</footer>
</div>


<style>
</style>
