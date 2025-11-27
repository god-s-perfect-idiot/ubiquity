<script>
	import Item from './Item.svelte';
	import { kernel } from '../../kernel/store';
	import { onMount } from 'svelte';
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

	let marketplaceItems = [];
	let localSources = [];
	let selectedSource = null;
	let searchQuery = '';
	let isLoading = true;
	let iconErrors = new Set();

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

	const loadMarketplaceItems = async () => {
		try {
			isLoading = true;
			// Map plural listing types to singular item types
			const typeMapping = {
				'apps': 'app',
				'music': 'music',
				'videos': 'video',
				'documents': 'document',
				'photos': 'image'
			};
			const type = typeMapping[listingType] || listingType.slice(0, -1);
			marketplaceItems = await fetchMarketplaceItems({ type });
		} catch (error) {
			console.error('Error loading marketplace items:', error);
			addToast('Failed to load marketplace items', 3000);
		} finally {
			isLoading = false;
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

	onMount(() => {
		initializeLocalSources();
		loadMarketplaceItems();
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
			<div class="flex flex-col gap-4 mt-8 flex-1 overflow-y-auto pb-16 px-4">
				{#if isLoading}
					<div class="flex flex-col items-center justify-center py-12 h-full my-16">
						<Loader />
					</div>
				{:else}
					{#each filteredSources as item}
						<button
							class="flex flex-row gap-4 items-start w-full text-left hover:bg-gray-800 p-2 rounded transition-colors"
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
										class="w-20 h-20 object-contain"
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
										? localSources.some((a) => {
												// remove https:// and http:// and www. and trailing slash and compare.
												const aUrl = a.content
													.replace('https://', '')
													.replace('http://', '')
													.replace('www.', '')
													.replace(/\/$/, '');
												const itemUrl = item.source
													.replace('https://', '')
													.replace('http://', '')
													.replace('www.', '')
													.replace(/\/$/, '');
												return aUrl === itemUrl;
											})
											? 'added'
											: 'not added'
										: 'checking...'}</span
								>
							</div>
						</button>
					{/each}
					{#if filteredSources.length === 0 && !isLoading}
						<div class="flex flex-col gap-4 items-start justify-center">
							<span class="text-2xl font-[300]"
								>No {listingType} found. Be the first to publish one!</span
							>
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
