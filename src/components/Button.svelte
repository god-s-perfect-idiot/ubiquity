<script>
    export let onClick;
    export let text;
    export let className;
</script>

<button class={`bg-[#000] text-white text-base py-1 border-2 border-white w-fit px-6 ${className} font-[500]`} on:click={onClick}>
    {text}
</button>

<style>
    button:focus, button:active, button:hover {
        background-color: #ff00ff;
    }
</style>