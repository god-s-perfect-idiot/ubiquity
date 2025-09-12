<script>
	import Icon from '@iconify/svelte';

	export let onBackClick = () => {};
</script>

<div class="flex flex-col gap-2 w-full h-screen]">
	<div class="ml-24 mt-4">
		<h1 class="text-3xl text-[#ff00ff]">Start Menu</h1>
		<p class="text-white">This is the start menu placeholder</p>
	</div>

	<button
		class="self-end mr-4 flex flex-col border h-10 w-10 mt-5 ml-6 justify-center items-center border-white rounded-full !border-2 p-2 font-bold"
		on:click={onBackClick}
	>
		<Icon icon="subway:right-arrow" width="18" height="18" strokeWidth="2" />
	</button>
</div>
