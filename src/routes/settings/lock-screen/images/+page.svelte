<script>
	import { settingsStore } from '../../../../store/settings';
	import { accentColorStore, borderColorClassStore } from '../../../../utils/theme';
	import { goto } from '$app/navigation';
	import Icon from '@iconify/svelte';

	export let isExiting = false;

	$: accentColor = $accentColorStore;
	$: borderClass = $borderColorClassStore;

	// Sample background images - in a real app, these would come from an API or be user-uploaded
	const backgroundImages = [
		{ id: 1, url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800', name: 'Mountain Landscape' },
		{ id: 2, url: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800', name: 'Ocean Waves' },
		{ id: 3, url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800', name: 'Forest Path' },
		{ id: 4, url: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800', name: 'City Skyline' },
		{ id: 5, url: 'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=800', name: 'Desert Dunes' },
		{ id: 6, url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800', name: 'Tropical Beach' },
		{ id: 7, url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800', name: 'Mountain Lake' },
		{ id: 8, url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800', name: 'Forest Trail' },
		{ id: 9, url: 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=800', name: 'Sunset Horizon' },
		{ id: 10, url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800', name: 'Misty Mountains' },
		{ id: 11, url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800', name: 'Alpine Valley' },
		{ id: 12, url: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800', name: 'Coastal Cliffs' }
	];

	let selectedImageId = null;

	// Load selected image from store
	$: {
		const selectedImage = settingsStore.get('lockScreen.selectedImageId');
		if (selectedImage !== undefined) {
			selectedImageId = selectedImage;
		}
	}

	// Handle image selection
	function handleImageSelect(imageId, imageUrl) {
		selectedImageId = imageId;
		settingsStore.set('lockScreen.selectedImageId', imageId);
		settingsStore.set('lockScreen.selectedImageUrl', imageUrl);
		settingsStore.set('lockScreen.backgroundType', 'image');
		// Go back to lock screen settings
		setTimeout(() => {
			goto('/settings?page=lock-screen');
		}, 300);
	}
    
	function goBack() {
		goto('/settings?page=lock-screen');
	}
</script>

<div class="page-holder">
	<div class="page pt-4 flex flex-col h-screen" class:page-exit={isExiting}>
		<div class="flex items-center gap-4 px-4 mb-4">
			<span class="text-6xl font-[300]">wallpaper</span>
		</div>
		<div class="flex flex-col gap-4 mt-4 flex-1 overflow-y-auto pb-24 px-4">
			<div class="grid grid-cols-3 gap-4">
				{#each backgroundImages as image}
					<button
						on:click={() => handleImageSelect(image.id, image.url)}
						class="relative aspect-square rounded-none overflow-hidden border-2 {selectedImageId === image.id ? borderClass : 'border-transparent'}"
						style="border-color: {selectedImageId === image.id ? accentColor : 'transparent'};"
					>
						<img
							src={image.url}
							alt={image.name}
							class="w-full h-full object-cover"
						/>
					</button>
				{/each}
			</div>
		</div>
	</div>
</div>

