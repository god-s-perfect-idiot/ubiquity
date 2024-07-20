<script>
    export let content;
    export let label="";
</script>

<div class="flex flex-col gap-2">
    <label for="content" class="text-[#767676] text-sm">{label}</label>
    <input type="text" bind:value={content} class="bg-[#bebebe] w-full py-2 pl-2 outline-none text-[#121212] text-base"/>
</div>