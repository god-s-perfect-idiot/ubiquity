<script>
	import { slide } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';

	export let selection;
	export let data = [];
	let open = false;
	selection = data[0];
	export let label = '';
</script>

<div class="flex flex-col gap-2 font-[400]">
    <span class="text-[#767676] text-sm">{label}</span>
    <div>
        {#if open}
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <!-- svelte-ignore a11y-no-static-element-interactions -->
            <div
                transition:slide={{ duration: 300, easing: cubicOut }}
                class="bg-white text-black pl-1 py-2 text-base border-[#ff00ff] border-2 flex flex-col gap-4"
                on:click={() => (open = false)}
            >
                {#each data as item}
                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                    <!-- svelte-ignore a11y-no-static-element-interactions -->
                    <div
                        on:click={() => {
                            selection = item;
                            open = false;
                        }}
                        class={selection === item ? 'text-[#ff00ff]' : ''}
                    >
                        {item}
                    </div>
                {/each}
            </div>
        {:else}
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <!-- svelte-ignore a11y-no-static-element-interactions -->
            <div class="bg-[#000] border-2 border-white text-base p-1" on:click={() => (open = true)}>
                {selection}
            </div>
        {/if}
    </div>
</div>