<script>
	import { sources } from './sources';
	import Item from './Item.svelte';
	import { kernel } from '../../kernel/store';
	import { onMount } from 'svelte';
	import { fetchApps, fetchVideos, fetchDocuments, fetchPhotos, fetchMusic } from '../../kernel/system-utils';
	import { addToast } from '../../store/toast';
    
	export let listingType = 'apps';
	export let toggleBottomBar = () => {};
	export let isExiting = false;

	const source = sources[listingType] || [];
	let localSources = [];
	let selectedSource = null;

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
    }

	const addOrRemove = (source) => {
        const fileTypes = {
            "apps": "app",
            "videos": "video",
            "documents": "document",
            "photos": "image",
            "music": "music"
        }

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
			kernel.addFile(
				appName,
				source.source,
				fileTypes[listingType]
			);
            addToast(`${appName} added`);
		}
        kernel.updateFS();
        initializeLocalSources();
	};

	const handleSourceClick = (source) => {
		selectedSource = source;
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
			<div class="flex flex-col gap-4 mt-12 flex-1 overflow-y-auto pb-16">
				{#each source as item}
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
                        <span class="text-2xl font-[300]">No {listingType} added yet. Please check back later.</span>
                    </div>
                {/if}
			</div>
		</div>
	</div>
{/if}
