<script>
    import BottomControls from '../../components/BottomControls.svelte';
import { kernel } from '../../kernel/store';
    import { fetchPhotos } from '../../kernel/system-utils';
    import { goto } from '$app/navigation';
	import Icon from '@iconify/svelte';
	import { onMount } from "svelte";
	import { backgroundClassStore, textColorClassStore } from '../../utils/theme';
    
    const photos = fetchPhotos(kernel.fs.getFiles());
    let isExpanded = false;
    let isUnmounting = false;
    let isExiting = false;
    let selectedPhoto = null;
    let showPhotoView = false;
    
    $: bgClass = $backgroundClassStore;
    $: textClass = $textColorClassStore;

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

    function openPhotoView(photo) {
        selectedPhoto = photo;
        showPhotoView = true;
        isExpanded = false; // Collapse bottom bar when opening photo view
    }

    function closePhotoView() {
        isExpanded = false;
        showPhotoView = false;
        selectedPhoto = null;
    }

    onMount(() => {
        isExpanded = false;
    });
</script>

{#if showPhotoView && selectedPhoto}
    <!-- Full-screen photo view -->
    <div class="fixed inset-0 {bgClass} z-50 flex items-center justify-center page-holder">
        <div class="relative w-full h-full page overflow-hidden" class:page-exit={isExiting}>
            <div class="absolute top-4 right-4 w-screen {bgClass} bg-opacity-50 {textClass} px-4 py-2 rounded">
                <span class="px-4 text-2xl">{selectedPhoto.name}</span>
            </div>

            <!-- Photo container -->
            <div class="w-full h-full flex items-center justify-center p-4">
                <img 
                    src={selectedPhoto.content} 
                    alt={selectedPhoto.name} 
                    class="w-full h-full object-contain"
                />
            </div>
        </div>
    </div>
{:else}
    <div class="page-holder">
        <div class="flex flex-col pt-4 w-full font-[400] h-screen page" class:page-exit={isExiting}>
            <span class="text-6xl font-[300] h-[10%] px-4 "> photos </span>
            <div class="mt-4 h-[90%] overflow-scroll px-4 pb-14">
                <div class="photos-grid">
                    {#each photos as photo}
                        <div class="photo-item" on:click={() => openPhotoView(photo)}>
                            <img src={photo.content} alt={photo.name} class="photo-image" />
                            <!-- <span>{photo.name}</span> -->
                        </div>
                    {/each}
                </div>
            </div>
        </div>
    </div>
{/if}

<BottomControls expanded={isExpanded} unmounting={isUnmounting} on:toggle={handleToggle}>
	<div class="flex flex-row gap-12 w-full justify-center items-center">
		{#if showPhotoView && selectedPhoto}
			<div class="btn-animate flex flex-col gap-2 justify-center items-center" class:animate={isExpanded}>
				<button on:click={closePhotoView} class="flex flex-col border border-white rounded-full !border-2 p-2 font-bold">
					<Icon icon="subway:left-arrow" width="18" height="18" strokeWidth="2"/>
				</button>
				<span class="text-xs font-[400]">previous</span>
			</div>
		{/if}
		<div class="btn-animate flex flex-col gap-2 justify-center items-center" class:animate={isExpanded}>
			<button on:click={closePage} class="flex flex-col border border-white rounded-full !border-2 p-2 font-bold">
				<Icon icon="rivet-icons:close" width="18" height="18" strokeWidth="2"/>
			</button>
			<span class="text-xs font-[400]">close</span>
		</div>
	</div>
</BottomControls>

<style>
    .photos-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 1rem;
        width: 100%;
    }

    .photo-item {
        aspect-ratio: 1;
        width: 100%;
        height: auto;
        cursor: pointer;
        transition: transform 0.2s ease;
    }

    .photo-item:hover {
        transform: scale(1.02);
    }

    .photo-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

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

