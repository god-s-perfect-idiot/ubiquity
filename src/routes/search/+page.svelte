<script>
	import BottomControls from '../../components/BottomControls.svelte';
	import SearchResults from './SearchResults.svelte';
	import Icon from '@iconify/svelte';
	import { goto } from '$app/navigation';
	import { searchActions } from '../../lib/search-actions.js';
	import { slide } from 'svelte/transition';
	import { onMount } from 'svelte';
	import { accentColorStore, textColorClassStore } from '../../utils/theme';

	let isExiting = false;
	let isExpanded = false;
	let isUnmounting = false;
	let searchQuery = '';
	let finalSearchQuery = '';
	let searchResults = [];
	let loading = false;
	let error = null;
	let currentPage = 0;
	let showSearchBar = false;
	
	$: accentColor = $accentColorStore;
	$: textClass = $textColorClassStore;

	onMount(() => {
		// Show search bar after a short delay to trigger slide-in animation
		setTimeout(() => {
			showSearchBar = true;
		}, 100);
	});

	function handleToggle(event) {
		isExpanded = event.detail.expanded;
	}

	function closePage() {
		showSearchBar = false; // Hide search bar to trigger slide-out animation
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

	async function handleSearch() {
		if (!searchQuery.trim()) return;

		console.log('Searching for:', searchQuery);
		finalSearchQuery = searchQuery;
		loading = true;
		error = null;
		currentPage = 0;

		try {
			searchResults = await searchActions.search(searchQuery);
			console.log('Search results:', searchResults);
		} catch (err) {
			console.error('Search error:', err);
			error = err.message;
		} finally {
			loading = false;
		}
	}

	function handleKeydown(event) {
		if (event.key === 'Enter') {
			handleSearch();
		}
	}

	function handleResultClick(result) {
		// Open in new tab
		window.open(result.url, '_blank', 'noopener,noreferrer');
	}
</script>

<div class="page-holder">
	<div class="pt-4 px-4 flex flex-col h-screen page" class:page-exit={isExiting}>
		<!-- Fixed title area -->
		<div class="flex-shrink-0 pb-4 overflow-hidden">
			<span class="text-5xl font-[300] truncate leading-tight block">{finalSearchQuery || 'search'}</span>
		</div>

		<!-- Search Results with constrained height -->
		<div class="flex-1 overflow-y-auto min-h-0">
			<SearchResults
				results={searchResults}
				{loading}
				{error}
				onResultClick={handleResultClick}
				{finalSearchQuery}
			/>
		</div>
	</div>
</div>

<!-- Search Input and Controls -->
{#if showSearchBar}
	<div
		class="absolute bottom-10 left-0 right-0"
		in:slide={{ duration: 300, axis: 'y' }}
		out:slide={{ duration: 200, axis: 'y' }}
	>
		<div class="flex flex-row">
			<!-- Search Input -->
			<div class="flex-1 relative">
				<input
					type="text"
					class="w-full h-12 bg-white text-xl text-black pl-4 pr-12 focus:outline-none z-[100]"
					bind:value={searchQuery}
					on:keydown={handleKeydown}
					placeholder="search the web..."
				/>
			</div>

			<!-- Search Button -->
			<button
				class="w-12 h-12 {textClass} flex justify-center items-center"
				style="background-color: {accentColor};"
				on:click={handleSearch}
				disabled={loading}
			>
				{#if loading}
					<div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
				{:else}
					<Icon icon="carbon:search" width="20" height="20" strokeWidth="2" />
				{/if}
			</button>
		</div>
	</div>
{/if}

<BottomControls expanded={isExpanded} unmounting={isUnmounting} on:toggle={handleToggle}>
	<div class="flex flex-row gap-12 w-full justify-center items-center">
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
