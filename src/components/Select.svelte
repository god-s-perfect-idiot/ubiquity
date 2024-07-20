<script>
	import { slide } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';

	export let selection;
	export let data = [];
	let open = false;
	selection = data[0];
	export let label = '';
</script>

<div class="flex flex-col gap-2">
    <span class="text-[#767676] text-sm">{label}</span>
    <div>
        {#if open}
            <div
                transition:slide={{ duration: 300, easing: cubicOut }}
                class="bg-white text-black pl-1 py-2 text-base border-[#f1b] border-2 flex flex-col gap-4"
                on:click={() => (open = false)}
            >
                {#each data as item}
                    <div
                        on:click={() => {
                            selection = item;
                            open = false;
                        }}
                        class={selection === item ? 'text-[#f1b]' : ''}
                    >
                        {item}
                    </div>
                {/each}
            </div>
        {:else}
            <div class="bg-[#000] border-2 border-white text-base p-1" on:click={() => (open = true)}>
                {selection}
            </div>
        {/if}
    </div>
</div>