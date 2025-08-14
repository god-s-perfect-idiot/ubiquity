<script>
    import { kernel } from '../../kernel/store';
    import { fetchPhotos } from '../../kernel/system-utils';

    const photos = fetchPhotos(kernel.fs.getFiles());

    console.log(photos);
</script>

<div class="page-holder">
    <div class="flex flex-col mt-4 w-full font-[400] h-screen page">
        <span class="text-6xl font-[300] h-[10%] px-4 "> photos </span>
        <div class="mt-4 h-[90%] overflow-scroll px-4">
            <div class="photos-grid">
                {#each photos as photo}
                    <div class="photo-item">
                        <img src={photo.content} alt={photo.name} class="photo-image" />
                        <!-- <span>{photo.name}</span> -->
                    </div>
                {/each}
            </div>
        </div>
        
    </div>
</div>

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
    }

    .photo-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
</style>

