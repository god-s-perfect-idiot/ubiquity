<script>
    export let pageTitle = "apps";
    let isExiting = false;
</script>

<div class="page-holder">
    <div class="page pt-4 px-4 flex flex-col" class:page-exit={isExiting}>
        <span class="text-6xl font-[300] h-[10%]">{pageTitle}</span>
        <div class="flex flex-col gap-1 mt-12">
            <span class="text-xl font-[300] text-[#ff00ff]"></span>
        </div>
    </div>
</div>