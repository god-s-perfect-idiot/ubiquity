<script>
	import Icon from '@iconify/svelte';
	import { kernel } from '../../kernel/store';
	import BottomControls from '../../components/BottomControls.svelte';
	import { goto } from '$app/navigation';
	import Listing from './Listing.svelte';
	import Publish from './Publish.svelte';
	import { onMount } from 'svelte';
	import { accentColorStore } from '../../utils/theme';

	let isExpanded = false;
	let isUnmounting = false;
	let isExiting = false;
	let subPage = 'categories';
	let hiddenBottomBar = false;
	let showSearch = false;
	
	$: accentColor = $accentColorStore;

	const handleToggle = () => {
		isExpanded = !isExpanded;
		showSearch = false;
	};

	const toggleBottomBar = (show) => {
		hiddenBottomBar = show;
	};

	const showSearchBar = () => {
		showSearch = true;
		isExpanded = false;
	};

	const closePage = () => {
		isUnmounting = true;
		setTimeout(() => {
			isExpanded = false;
			setTimeout(() => {
				isExiting = true;
				setTimeout(() => {
					goto('/');
				}, 200); // Match the animation duration
			}, 300); // Allow time for bottom controls to collapse
		}, 300);
	};

	const changeSubPage = (page) => {
		subPage = page;
		isExpanded = false;
	};

	onMount(() => {
		isExpanded = false;
	});
</script>

{#if subPage === 'categories'}
	<div class="page-holder">
		<div class="page pt-4 px-4 flex flex-col" class:page-exit={isExiting}>
			<span class="text-6xl font-[300] h-[10%]">marketplace</span>
			<div class="flex flex-col gap-1 mt-12">
				<span class="text-xl font-[300]" style="color: {accentColor};">categories</span>
				<div class="flex flex-col gap-4">
					<button
						class="text-4xl font-[300] text-left"
						on:click={() => {
							changeSubPage('apps');
						}}
					>
						apps
					</button>
					<button
						class="text-4xl font-[300] text-left"
						on:click={() => {
							changeSubPage('music');
						}}
					>
						music
					</button>
					<button
						class="text-4xl font-[300] text-left"
						on:click={() => {
							changeSubPage('videos');
						}}
					>
						videos
					</button>
					<button
						class="text-4xl font-[300] text-left"
						on:click={() => {
							changeSubPage('documents');
						}}
					>
						documents
					</button>
					<button
						class="text-4xl font-[300] text-left"
						on:click={() => {
							changeSubPage('photos');
						}}
					>
						photos
					</button>
				</div>
			</div>
		</div>
	</div>
{:else if subPage === 'apps'}
	<Listing listingType="apps" {toggleBottomBar} {isExiting} {showSearch} />
{:else if subPage === 'music'}
	<Listing listingType="music" {toggleBottomBar} {isExiting} {showSearch} />
{:else if subPage === 'videos'}
	<Listing listingType="videos" {toggleBottomBar} {isExiting} {showSearch} />
{:else if subPage === 'documents'}
	<Listing listingType="documents" {toggleBottomBar} {isExiting} {showSearch} />
{:else if subPage === 'photos'}
	<Listing listingType="photos" {toggleBottomBar} {isExiting} {showSearch} />
{:else if subPage === 'publish'}
	<Publish {toggleBottomBar} {changeSubPage}/>
{/if}

{#if !hiddenBottomBar}
	<BottomControls expanded={isExpanded} unmounting={isUnmounting} on:toggle={handleToggle}>
		<div class="flex flex-row gap-12 w-full justify-center items-center">
			{#if subPage !== 'categories'}
				<div
					class="btn-animate flex flex-col gap-2 justify-center items-center"
					class:animate={isExpanded}
				>
					<button
						on:click={() => {
							changeSubPage('categories');
						}}
						class="flex flex-col border border-white rounded-full !border-2 p-2 font-bold"
					>
						<Icon icon="subway:left-arrow" width="18" height="18" strokeWidth="2" />
					</button>
					<span class="text-xs font-[400]">back</span>
				</div>
				<div
					class="btn-animate flex flex-col gap-2 justify-center items-center"
					class:animate={isExpanded}
				>
					<button
						on:click={() => {
							showSearchBar();
						}}
						class="flex flex-col border border-white rounded-full !border-2 p-2 font-bold"
					>
						<Icon icon="mdi:search" width="18" height="18" strokeWidth="2" />
					</button>
					<span class="text-xs font-[400]">search</span>
				</div>
			{:else}
				<div
					class="btn-animate flex flex-col gap-2 justify-center items-center"
					class:animate={isExpanded}
				>
					<button
						on:click={() => {
							changeSubPage('publish');
						}}
						class="flex flex-col border border-white rounded-full !border-2 p-2 font-bold"
					>
						<Icon icon="ic:baseline-publish" width="18" height="18" strokeWidth="2" />
					</button>
					<span class="text-xs font-[400]">Publish</span>
				</div>
			{/if}
			<div
				class="btn-animate flex flex-col gap-2 justify-center items-center"
				class:animate={isExpanded}
			>
				<button
					on:click={closePage}
					class="flex flex-col border border-white rounded-full !border-2 p-2 font-bold"
				>
					<Icon icon="rivet-icons:close" width="18" height="18" strokeWidth="2" />
				</button>
				<span class="text-xs font-[400]">close</span>
			</div>
		</div>
	</BottomControls>
{/if}

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
