<script>
	import Item from './Item.svelte';
	import { kernel } from '../../kernel/store';
	import { onMount, tick } from 'svelte';
	import {
		fetchApps,
		fetchVideos,
		fetchDocuments,
		fetchPhotos,
		fetchMusic
	} from '../../kernel/system-utils';
	import { addToast } from '../../store/toast';
	import Icon from '@iconify/svelte';
	import { slide, fade } from 'svelte/transition';
	import { fetchMarketplaceItems, convertToKernelFile } from '../../lib/marketplace-utils.js';
	import Loader from '../../components/Loader.svelte';
	import { appInfoStore } from '../../store/appInfo.js';
	import { accentColorStore, textColorClassStore } from '../../utils/theme';
	export let listingType = 'apps';
	export let toggleBottomBar = () => {};
	export let isExiting = false;
	export let showSearch = false;
	
	$: accentColor = $accentColorStore;
	$: textClass = $textColorClassStore;

	const PAGE_SIZE = 50;

	let marketplaceItems = [];
	let localSources = [];
	let selectedSource = null;
	let searchQuery = '';
	let isLoading = true;
	let isLoadingMore = false;
	let hasMore = true;
	let listOffset = 0;
	let scrollContainer;
	let iconErrors = new Set();

	const typeMapping = {
		apps: 'app',
		music: 'music',
		videos: 'video',
		documents: 'document',
		photos: 'image'
	};

	const getItemType = () => typeMapping[listingType] || listingType.slice(0, -1);

	const initializeLocalSources = () => {
		switch (listingType) {
			case 'apps':
				localSources = fetchApps(kernel.fs.getFiles());
				break;
			case 'videos':
				localSources = fetchVideos(kernel.fs.getFiles());
				break;
			case 'documents':
				localSources = fetchDocuments(kernel.fs.getFiles());
				break;
			case 'photos':
				localSources = fetchPhotos(kernel.fs.getFiles());
				break;
			case 'music':
				localSources = fetchMusic(kernel.fs.getFiles());
				break;
		}
		console.log(localSources);
	};

	const fetchPage = async (offset) => {
		return fetchMarketplaceItems({
			type: getItemType(),
			limit: PAGE_SIZE,
			offset
		});
	};

	const resetAndLoad = async () => {
		listOffset = 0;
		hasMore = true;
		marketplaceItems = [];
		try {
			isLoading = true;
			const items = await fetchPage(0);
			marketplaceItems = items;
			hasMore = items.length === PAGE_SIZE;
			listOffset = items.length;
		} catch (error) {
			console.error('Error loading marketplace items:', error);
			addToast('Failed to load marketplace items', 3000);
		} finally {
			isLoading = false;
			await fillViewportIfNeeded();
		}
	};

	const loadMore = async () => {
		if (!hasMore || isLoading || isLoadingMore || searchQuery.length > 0) return;

		try {
			isLoadingMore = true;
			const items = await fetchPage(listOffset);
			marketplaceItems = [...marketplaceItems, ...items];
			hasMore = items.length === PAGE_SIZE;
			listOffset += items.length;
		} catch (error) {
			console.error('Error loading more marketplace items:', error);
			addToast('Failed to load more items', 3000);
		} finally {
			isLoadingMore = false;
			await fillViewportIfNeeded();
		}
	};

	const fillViewportIfNeeded = async () => {
		await tick();
		if (!scrollContainer || !hasMore || isLoading || isLoadingMore || searchQuery.length > 0) return;

		const distanceFromBottom =
			scrollContainer.scrollHeight - scrollContainer.scrollTop - scrollContainer.clientHeight;
		if (distanceFromBottom < 300) {
			await loadMore();
		}
	};

	const handleScroll = (event) => {
		if (!hasMore || isLoading || isLoadingMore || searchQuery.length > 0) return;

		const el = event.currentTarget;
		const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
		if (distanceFromBottom < 300) {
			loadMore();
		}
	};

	$: filteredSources =
		searchQuery.length > 0
			? marketplaceItems.filter((a) => a.name.toLowerCase().includes(searchQuery.toLowerCase()))
			: marketplaceItems;

	const findAppName = (source) => {
		if (localSources && localSources.length > 0) {
			return localSources.find((a) => {
				// remove https:// and http:// and www. and trailing slash and compare.
				const aUrl = a.content
					.replace('https://', '')
					.replace('http://', '')
					.replace('www.', '')
					.replace(/\/$/, '');
				const itemUrl = source.source
					.replace('https://', '')
					.replace('http://', '')
					.replace('www.', '')
					.replace(/\/$/, '');
				return aUrl === itemUrl;
			})?.name;
		}
		return null;
	};

	const addOrRemove = (source) => {
		const fileTypes = {
			apps: 'app',
			videos: 'video',
			documents: 'document',
			photos: 'image',
			music: 'music'
		};

		if (
			localSources &&
			localSources.length > 0 &&
			localSources.some((a) => {
				// remove https:// and http:// and www. and trailing slash and compare.
				const aUrl = a.content
					.replace('https://', '')
					.replace('http://', '')
					.replace('www.', '')
					.replace(/\/$/, '');
				const itemUrl = source.source
					.replace('https://', '')
					.replace('http://', '')
					.replace('www.', '')
					.replace(/\/$/, '');
				return aUrl === itemUrl;
			})
		) {
			const appName = findAppName(source);
			kernel.removeFile(appName, fileTypes[listingType]);
			
			// Remove from appInfo store
			appInfoStore.removeAppInfo(appName);
			appInfoStore.removeAppInfo(source.source);
			
			addToast(`${appName} removed`);
		} else {
			// Convert marketplace item to kernel file format
			const kernelFile = convertToKernelFile(source);
			kernel.addFile(kernelFile.name, kernelFile.content, fileTypes[listingType]);
			
			// Store app info (icon, background, and other Firebase metadata)
			const appInfo = {
				icon: source.icon,
				backgroundColor: source.background,
				bgColor: source.background,
				name: source.name,
				description: source.description,
				owner: source.owner,
				category: source.category,
				tags: source.tags,
				...source // Store all Firebase data
			};
			
			// Store by both name and URL for easy lookup
			appInfoStore.setAppInfo(kernelFile.name, appInfo);
			appInfoStore.setAppInfo(source.source, appInfo);
			
			addToast(`${kernelFile.name} added`);
		}
		kernel.updateFS();
		initializeLocalSources();
	};

	const handleSourceClick = (source) => {
		selectedSource = source;
		showSearch = false;
	};

	const handleIconError = (item, event) => {
		event.preventDefault();
		iconErrors.add(item.id);
		iconErrors = iconErrors; // Trigger reactivity
	};

	const getFirstLetter = (name) => {
		return name ? name.charAt(0).toLowerCase() : '?';
	};

	const isIconError = (item) => {
		// Check if item has no icon, invalid icon, or icon failed to load
		return !item.icon || iconErrors.has(item.id);
	};

	const isValidUrl = (url) => {
		try {
			new URL(url);
			return true;
		} catch {
			return false;
		}
	};

	const isItemAdded = (item) => {
		if (!localSources?.length) return false;
		const itemUrl = item.source
			.replace('https://', '')
			.replace('http://', '')
			.replace('www.', '')
			.replace(/\/$/, '');
		return localSources.some((a) => {
			const aUrl = a.content
				.replace('https://', '')
				.replace('http://', '')
				.replace('www.', '')
				.replace(/\/$/, '');
			return aUrl === itemUrl;
		});
	};

	const getPhotoImageUrl = (item) => {
		if (item.icon && isValidUrl(item.icon)) return item.icon;
		if (item.source && isValidUrl(item.source)) return item.source;
		return null;
	};

	let prevListingType = listingType;

	$: if (listingType !== prevListingType) {
		prevListingType = listingType;
		initializeLocalSources();
		resetAndLoad();
	}

	onMount(() => {
		initializeLocalSources();
		resetAndLoad();
	});
</script>

{#if selectedSource}
	<Item
		item={selectedSource}
		{toggleBottomBar}
		exit={() => {
			selectedSource = null;
		}}
		{addOrRemove}
		isAdded={localSources && localSources.length > 0
			? localSources.some((a) => {
					// remove https:// and http:// and www. and trailing slash and compare.
					const aUrl = a.content
						.replace('https://', '')
						.replace('http://', '')
						.replace('www.', '')
						.replace(/\/$/, '');
					const itemUrl = selectedSource.source
						.replace('https://', '')
						.replace('http://', '')
						.replace('www.', '')
						.replace(/\/$/, '');
					return aUrl === itemUrl;
				})
			: false}
	/>
{:else}
	<div class="page-holder">
		<div class="page pt-4 flex flex-col h-screen" class:page-exit={isExiting}>
			<span class="text-6xl font-[300] flex-shrink-0 px-4">{listingType}</span>
			{#if searchQuery.length > 0}
				<div
					class="flex flex-col gap-2 pt-4 px-4"
					in:slide={{ duration: 300, axis: 'y' }}
					out:slide={{ duration: 300, axis: 'y' }}
				>
					<span class="text-2xl font-[300]" style="color: {accentColor};">Showing results for "{searchQuery}"</span
					>
					<span class="text-sm font-[300] text-[#7e7e7e]">
						{filteredSources.length} results found
					</span>
				</div>
			{/if}
			<div
				bind:this={scrollContainer}
				class="mt-8 flex-1 overflow-y-auto pb-16 px-4"
				class:flex={listingType !== 'photos'}
				class:flex-col={listingType !== 'photos'}
				class:gap-4={listingType !== 'photos'}
				on:scroll={handleScroll}
			>
				{#if isLoading}
					<div class="flex flex-col items-center justify-center py-12 h-full my-16">
						<Loader />
					</div>
				{:else if listingType === 'photos'}
					<div class="photos-grid">
						{#each filteredSources as item, index}
							<button
								class="photo-item flip-in"
								style="animation-delay: {Math.min(index * 30, 360)}ms;{isItemAdded(item) ? ` outline: 3px solid ${accentColor};` : ''}"
								on:click={() => handleSourceClick(item)}
								on:keydown={(e) => e.key === 'Enter' && handleSourceClick(item)}
							>
								{#if isIconError(item) || !getPhotoImageUrl(item)}
									<div
										class="w-full h-full flex items-end justify-start pl-4 pb-4 {textClass} text-4xl font-[300] lowercase"
										style="background-color: {item.background || '#2a2a2a'};"
									>
										{getFirstLetter(item.name)}
									</div>
								{:else}
									<img
										src={getPhotoImageUrl(item)}
										alt={item.name}
										class="photo-image"
										onerror={() => {
											iconErrors.add(item.id);
											iconErrors = iconErrors;
										}}
									/>
								{/if}
							</button>
						{/each}
					</div>
					{#if filteredSources.length === 0}
						<div class="flex flex-col gap-4 items-start justify-center">
							<span class="text-2xl font-[300]"
								>No {listingType} found. Be the first to publish one!</span
							>
						</div>
					{/if}
					{#if isLoadingMore}
						<div class="flex justify-center py-6 w-full">
							<Loader />
						</div>
					{/if}
				{:else}
					{#each filteredSources as item}
						<button
							class="flex flex-row gap-4 items-start w-full text-left p-2 rounded transition-colors"
							on:click={() => handleSourceClick(item)}
							on:keydown={(e) => e.key === 'Enter' && handleSourceClick(item)}
						>
							<div
								class="w-24 h-24 min-w-24 min-h-24 flex items-center justify-center"
								style="background-color: {item.background};"
							>
								{#if isIconError(item) || !isValidUrl(item.icon)}
									<div
										class="w-full h-full flex items-end justify-start pl-4 pb-4 {textClass} text-4xl font-[300] lowercase"
									>
										{getFirstLetter(item.name)}
									</div>
								{:else}
									<img
										src={item.icon}
										alt=""
										class="w-full h-full object-cover"
										onerror={() => {
											iconErrors.add(item.id);
											iconErrors = iconErrors;
										}}
									/>
								{/if}
							</div>
							<div class="flex flex-col gap-1 items-start">
								<span class="text-2xl font-[300] capitalize line-clamp-1">{item.name}</span>
								<span class="text-base font-[300] text-[#7e7e7e]">{item.owner}</span>
								<span class="text-sm font-[300]"
									>{localSources && localSources.length > 0
										? isItemAdded(item)
											? 'added'
											: 'not added'
										: 'checking...'}</span
								>
							</div>
						</button>
					{/each}
					{#if filteredSources.length === 0}
						<div class="flex flex-col gap-4 items-start justify-center">
							<span class="text-2xl font-[300]"
								>No {listingType} found. Be the first to publish one!</span
							>
						</div>
					{/if}
					{#if isLoadingMore}
						<div class="flex justify-center py-6 w-full">
							<Loader />
						</div>
					{/if}
				{/if}
			</div>
		</div>
	</div>
	{#if showSearch}
		<div
			class="fixed bottom-[40px] left-0 right-0 z-50 flex justify-center items-center"
			in:slide={{ duration: 300, axis: 'y' }}
			out:slide={{ duration: 300, axis: 'y' }}
		>
			<div class="relative w-full max-w-md">
				<input
					type="text"
					placeholder="search"
					class="w-full px-4 py-2 text-black pr-12"
					bind:value={searchQuery}
				/>
				<button
					class="absolute right-2 top-1/2 transform -translate-y-1/2 border-[3px] border-black rounded-full h-8 w-8 flex items-center justify-center"
					on:click={() => (showSearch = false)}
				>
					<Icon icon="mdi:close-thick" width="21" height="21" class="text-black" />
				</button>
			</div>
		</div>
	{/if}
{/if}

<style>
	.photos-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1rem;
		width: 100%;
		perspective: 1000px;
	}

	.photo-item {
		aspect-ratio: 1;
		width: 100%;
		height: auto;
		padding: 0;
		border: none;
		background: none;
		cursor: pointer;
		overflow: hidden;
		transform-origin: left center;
		backface-visibility: hidden;
	}

	.photo-item.flip-in {
		animation: photoFlipIn 0.2s ease-out backwards;
	}

	.photo-item:active {
		transform: scale(0.98);
	}

	@keyframes photoFlipIn {
		from {
			transform: rotateY(90deg);
			opacity: 0;
		}
		to {
			transform: rotateY(0deg);
			opacity: 1;
		}
	}

	.photo-image {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}
</style>
