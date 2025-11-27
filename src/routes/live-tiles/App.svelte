<script>
	import Icon from '@iconify/svelte';
	import { borderColorClassStore } from '../../utils/theme';
	
	export let app = null;
	export let isExiting = false;
	export let onBack = () => {};
	
	$: borderClass = $borderColorClassStore;
</script>

<div class="page-holder">
	<div class="page pt-4 px-4 flex flex-col h-screen" class:page-exit={isExiting}>
		{#if app}
			<span class="text-6xl font-[300] truncate lowercase pb-8 h-auto">{app.name}</span>
			<!-- Content will be added here -->
		{:else}
			<span class="text-6xl font-[300]">No app selected</span>
		{/if}
	</div>
</div>

