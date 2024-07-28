<script>
    export let isSystemApp = false;
</script>

<div
	class="app-menu-content animated-div bg-white w-full flex flex-col text-black font-[300] pl-4 pt-4 pb-16 gap-4 z-10 absolute top-1 justify-start items-start"
>
	<span class="override-touch-controls">add new file</span>
	<span class="text-gray-300">pin to start</span>
	{#if !isSystemApp}
        <span class="override-touch-controls">uninstall</span>
    {/if}
</div>

<style>
	.animated-div {
		animation: expand 0.5s ease-in forwards;
		overflow: hidden;
		max-height: 0;
	}

	@keyframes expand {
		from {
			max-height: 0;
            padding-top: 0;
            padding-bottom: 0;
		}
		to {
			max-height: 200px; /* Adjust this value based on your content */
            padding-top: 1rem;
            padding-bottom: 4rem;
		}
	}
</style>