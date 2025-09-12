<script>
	import Header from './Header.svelte';
	import "../app.css"
	import Notifier from '../components/Notifier.svelte';
	import NavBar from '../components/NavBar.svelte';
	import '../kernel/debug.js';
	import { registerServiceWorker, setupInstallPrompt } from '../lib/pwa.js';
	import { onMount } from 'svelte';

	onMount(() => {
		// Register service worker
		registerServiceWorker();
		// Setup install prompt
		setupInstallPrompt();
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
