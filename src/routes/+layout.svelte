<script>
	import Header from './Header.svelte';
	import "../app.css"
	import Notifier from '../components/Notifier.svelte';
	import NavBar from '../components/NavBar.svelte';
	import '../kernel/debug.js';
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
