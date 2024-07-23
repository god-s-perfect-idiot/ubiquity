<!-- Toast.svelte -->
<script>
    export let content = "";
    export let duration = 2000;
    let visible = true;

    setTimeout(() => {
        visible = false;
    }, duration);
</script>

{#if visible}
    <div class="absolute z-10 top-0 w-full bg-[#ff00ff] px-2 py-4 text-xl toast font-[400]">
        {content}
    </div>
{/if}

<style>
    .toast {
        animation: fadeInOut 2s ease-in-out forwards;
    }

    @keyframes fadeInOut {
        0% { opacity: 0; transform: translateY(-20px); }
        10% { opacity: 1; transform: translateY(0); }
        90% { opacity: 1; transform: translateY(0); }
        100% { opacity: 0; transform: translateY(-20px); }
    }
</style>