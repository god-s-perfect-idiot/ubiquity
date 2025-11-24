<script>
	import Header from './Header.svelte';
	import "../app.css"
	import Notifier from '../components/Notifier.svelte';
	import NavBar from '../components/NavBar.svelte';
	import '../kernel/debug.js';
	import { registerServiceWorker, setupInstallPrompt } from '../lib/pwa.js';
	import { onMount } from 'svelte';
	import { backgroundThemeStore, textColorClassStore } from '../utils/theme';

	// Get theme reactively
	$: backgroundTheme = $backgroundThemeStore;
	$: textColorClass = $textColorClassStore;
	$: bodyBgColor = backgroundTheme === 'light' ? '#ffffff' : '#000000';
	$: bodyTextColor = backgroundTheme === 'light' ? '#000000' : '#ffffff';

	// Update body styles reactively
	$: {
		if (typeof document !== 'undefined') {
			document.body.style.backgroundColor = bodyBgColor;
			document.body.style.color = bodyTextColor;
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
