<script>
    import Button from '../../components/Button.svelte';
    import { onMount, onDestroy } from 'svelte';
    
    let isExiting = false;
    let iconError = false;

    export let item = null;
    export let toggleBottomBar = () => {};
    export let exit = () => {};
    export let addOrRemove = () => {};
    export let isAdded = false; 


    const close = () => {
        isExiting = true;
        setTimeout(() => {
            exit();
        }, 200);
    };

    const handleIconError = () => {
        iconError = true;
    };

    const getFirstLetter = (name) => {
        return name ? name.charAt(0).toLowerCase() : '?';
    };

    const isValidUrl = (url) => {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    };

    onMount(() => {
        toggleBottomBar(true);
    });

    onDestroy(() => {
        toggleBottomBar(false);
    });

</script>

<div class="page-holder">
    <div class="page pt-4 px-4 flex flex-col h-screen" class:page-exit={isExiting}>
        <span class="text-6xl font-[300] flex-shrink-0 break-words">{item.name}</span>
        <div class="flex flex-col gap-4 mt-12 flex-1 overflow-y-auto pb-16">
            <div class="flex flex-col gap-4 items-start">
                <div class="w-40 h-40 flex items-center justify-center" style="background-color: {item.background};">
                    {#if iconError || !isValidUrl(item.icon)}
                        <div class="w-full h-full flex items-end justify-start pl-4 pb-4 text-white text-5xl font-[300] lowercase">
                            {getFirstLetter(item.name)}
                        </div>
                    {:else}
                        <img 
                            src={item.icon} 
                            alt="" 
                            class="w-36 h-36 object-contain" 
                            onerror={handleIconError}
                        />
                    {/if}
                </div>
                <div class="flex flex-col gap-1 items-start">
                    <span class="text-base font-[300] text-[#7e7e7e]">{item.owner}</span>
                    <span class="text-[0.8rem] font-[300]">{item.source}</span>
                </div>
                <div class="flex flex-col gap-1 items-start">
                    <span class="text-xl font-[300] text-[#ff00ff]">description</span>
                    <span class="text-lg font-[100]">{item.description}</span>
                </div>
            </div>
        </div>
    </div>
</div>

<div
    class="w-full justify-between flex flex-row fixed bottom-0 right-0 px-4 py-2 bg-[#1f1f1f] gap-8 z-10 bottom-bar"
    class:bottom-bar-exit={isExiting}
>
    <div class="btn w-full">
        <Button text={isAdded ? "remove" : "add"} onClick={() => addOrRemove(item)} className="btn !w-full bg-[#1f1f1f]" />
    </div>
    <div class="btn w-full">
        <Button text="close" onClick={close} className="btn !w-full bg-[#1f1f1f]" />
    </div>
</div>
