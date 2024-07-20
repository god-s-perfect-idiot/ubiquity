<script>
	import Header from './Header.svelte';
	import "../app.css"
	import Notifier from '../components/Notifier.svelte';

</script>

<div class="app">
	<Notifier />
	<Header />
	<main>
		<slot />
	</main>

	<footer></footer>
</div>

<style>
</style>
