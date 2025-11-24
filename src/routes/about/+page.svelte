<script>
	import Icon from "@iconify/svelte";
	import BottomControls from "../../components/BottomControls.svelte";
	import { goto } from "$app/navigation";
	import { onMount } from "svelte";
	import { accentColorStore } from "../../utils/theme";

    let isExpanded = false;
    let isUnmounting = false;
    let isExiting = false;
    
    $: accentColor = $accentColorStore;

    const handleToggle = () => {
        isExpanded = !isExpanded;
    };

    function closePage() {
        isUnmounting = true;
        setTimeout(() => {
            isExpanded = false;
            setTimeout(() => {
                isExiting = true;
                setTimeout(() => {
                    goto('/');
                }, 200); // Match the animation duration
            }, 300); // Allow time for bottom controls to collapse
        }, 300); // Allow time for unmounting animation
    }

    onMount(() => {
        isExpanded = false;
    });
</script>

<div class="page-holder">
    <div class="flex flex-col mt-4 w-full font-[400] h-screen page" class:page-exit={isExiting}>
        <span class="text-6xl font-[300] h-[10%] px-4 "> extras+info </span>
        <div class="mt-4 h-[90%] overflow-scroll px-4 ">
            <span class="text-[#767676] text-base mt-4"> Software Release </span>
            <div class="flex flex-row justify-between w-full items-end">
                <span class="text-4xl font-[300] mt-2" style="color: {accentColor};"> Ubiquity Fuschia</span>
                <span
                    class="border-2 w-10 h-10 rounded-full flex justify-center items-center"
                    style="color: {accentColor}; border-color: {accentColor};"
                >
                    <a href="https://github.com/god-s-perfect-idiot/ubiquity">
                        <i class="fa-solid fa-info"></i>
                    </a></span
                >
            </div>
            <span class="text-lg mt-4 underline font-[300]"> Privacy Policy </span>
            <div class="flex flex-col gap-2 mt-6 text-lg font-[300]">
                <span>Ubiquity Version v-1.0</span>
                <span>File Explorer v-1.0</span>
                <span>Marketplace v-1.0</span>
                <span>Music Player v-1.0</span>
                <span>Photos v-1.0</span>
                <span>Video v-1.0</span>
                <span>Settings v-1.0</span>
                <span>Documents v-1.0</span>
                <span>Spotify (Metro) v-1.0</span>
                <span>Weather v-1.0</span>
            </div>
            <div class="mt-12 mb-8">
                <span class="text-2xl" style="color: {accentColor};">faq</span>
            </div>
            <div class="flex flex-col gap-6 font-[300] mb-16">
                <div class="flex flex-col">
                    <span class="text-xl">What is Ubiquity?</span>
                    <span class="text-sm text-[#767676] mt-1">Ubiquity is a browser based Operating System for all of your web apps, images, music and videos.</span>
                </div>
                <div class="flex flex-col">
                    <span class="text-xl">Easy Add file menu</span>
                    <span class="text-sm text-[#767676] mt-1">You can access the quick way to add new files by long pressing (or right clicking) anywhere in the apps screen</span>
                </div>
                <div class="flex flex-col">
                    <span class="text-xl">Where is my data stored?</span>
                    <span class="text-sm text-[#767676] mt-1">Ubiquity uses your browser's local storage for all data manipulation. No data is sent or processed for you at the server. Keep in mind that this also limits the total available storage to 5MBs of urls</span>
                </div>
                <div class="flex flex-col">
                    <span class="text-xl">Is it free to use?</span>
                    <span class="text-sm text-[#767676] mt-1">Ubiquity is free and open source. The github repository can be accessed using the icon in the software release section in this page.</span>
                </div>
                <div class="flex flex-col">
                    <span class="text-xl">Where are my logged in accounts stored?</span>
                    <span class="text-sm text-[#767676] mt-1">Ubiquity uses your browser's local storage for storing credentials to all connected accounts. This is not stored on any server or third party service.</span>
                </div>
            </div>
        </div>
        
    </div>
</div>



<BottomControls expanded={isExpanded} unmounting={isUnmounting} on:toggle={handleToggle}>
	<div class="flex flex-row gap-12 w-full justify-center items-center">
		<div class="btn-animate flex flex-col gap-2 justify-center items-center" class:animate={isExpanded}>
			<button on:click={closePage} class="flex flex-col border border-white rounded-full !border-2 p-2 font-bold">
				<Icon icon="rivet-icons:close" width="18" height="18" strokeWidth="2"/>
			</button>
			<span class="text-xs font-[400]">close</span>
		</div>
	</div>
</BottomControls>

<style>
    .btn-animate {
		transform: translateY(120%);
		opacity: 0;
	}
	
	.btn-animate.animate {
		animation: button-overshoot 0.5s ease-out forwards;
		opacity: 1;
	}
	
	@keyframes button-overshoot {
		0% {
			transform: translateY(120%);
		}
		70% {
			transform: translateY(-20%);
		}
		100% {
			transform: translateY(0);
		}
	}
</style>