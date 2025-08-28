<script>
	import { sources } from './sources';
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
	export let listingType = 'apps';
	export let toggleBottomBar = () => {};
	export let isExiting = false;
	export let showSearch = false;

	const source = sources[listingType] || [];
	let localSources = [];
	let selectedSource = null;
	let searchQuery = '';

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

	$: filteredSources =
		searchQuery.length > 0
			? source.filter((a) => a.name.toLowerCase().includes(searchQuery.toLowerCase()))
			: source;

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
			addToast(`${appName} removed`);
		} else {
			// substring the listingType from 0 to length - 1 ie, apps -> app
			const appName = `${source.name[0].toUpperCase()}${source.name.substring(1)}`;
			kernel.addFile(appName, source.source, fileTypes[listingType]);
			addToast(`${appName} added`);
		}
		kernel.updateFS();
		initializeLocalSources();
	};

	const handleSourceClick = (source) => {
		selectedSource = source;
		showSearch = false;
	};

	onMount(() => {
		initializeLocalSources();
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
		<div class="page pt-4 px-4 flex flex-col h-screen" class:page-exit={isExiting}>
			<span class="text-6xl font-[300] flex-shrink-0">{listingType}</span>
			{#if searchQuery.length > 0}
				<div
					class="flex flex-col gap-2 pt-4"
					in:slide={{ duration: 300, axis: 'y' }}
					out:slide={{ duration: 300, axis: 'y' }}
				>
					<span class="text-2xl font-[300] text-[#ff00ff]">Showing results for "{searchQuery}"</span
					>
					<span class="text-sm font-[300] text-[#7e7e7e]">
						{filteredSources.length} results found
					</span>
				</div>
			{/if}
			<div class="flex flex-col gap-4 mt-8 flex-1 overflow-y-auto pb-16">
				{#each filteredSources as item}
					<div class="flex flex-row gap-4 items-start" on:click={() => handleSourceClick(item)}>
						<div
							class="w-24 h-24 min-w-24 min-h-24 flex items-center justify-center"
							style="background-color: {item.background}; text-color: white;"
						>
							<img src={item.icon} alt={item.name} class="w-20 h-20 object-contain" />
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
					</div>
				{/each}
				{#if source.length === 0}
					<div class="flex flex-col gap-4 items-start justify-center">
						<span class="text-2xl font-[300]"
							>No {listingType} added yet. Please check back later.</span
						>
					</div>
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
