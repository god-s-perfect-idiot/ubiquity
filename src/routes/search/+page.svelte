<script>
	import BottomControls from '../../components/BottomControls.svelte';
	import SearchResults from './SearchResults.svelte';
	import Icon from '@iconify/svelte';
	import { goto } from '$app/navigation';
	import { searchActions } from '../../lib/search-actions.js';
	import { RESULT_ACTIONS } from '../../lib/search-types.js';
	import { slide } from 'svelte/transition';
	import { onMount, onDestroy } from 'svelte';
	import { accentColorStore, textColorClassStore } from '../../utils/theme';

	let isExiting = false;
	let isExpanded = false;
	let isUnmounting = false;
	let searchQuery = '';
	let finalSearchQuery = '';
	let searchResults = [];
	let resultGroups = [];
	let loading = false;
	let error = null;
	let showSearchBar = false;
	let selectedIndex = -1;
	let searchDebounce = null;
	let searchGeneration = 0;

	$: accentColor = $accentColorStore;
	$: textClass = $textColorClassStore;
	$: navbarHeight = isExpanded ? 80 : 40;
	$: flatResults = resultGroups.length
		? resultGroups.flatMap((g) => g.results)
		: searchResults;

	onMount(() => {
		setTimeout(() => {
			showSearchBar = true;
		}, 100);
	});

	onDestroy(() => {
		if (searchDebounce) clearTimeout(searchDebounce);
	});

	function handleToggle(event) {
		isExpanded = event.detail.expanded;
	}

	function closePage() {
		showSearchBar = false;
		isUnmounting = true;
		setTimeout(() => {
			isExpanded = false;
			setTimeout(() => {
				isExiting = true;
				setTimeout(() => {
					goto('/');
				}, 200);
			}, 300);
		}, 300);
	}

	async function runSearch(query) {
		const trimmed = query.trim();
		if (!trimmed) {
			searchResults = [];
			resultGroups = [];
			finalSearchQuery = '';
			selectedIndex = -1;
			loading = false;
			return;
		}

		const generation = ++searchGeneration;
		finalSearchQuery = trimmed;
		loading = true;
		error = null;
		selectedIndex = -1;

		try {
			const { results, groups } = await searchActions.unifiedSearch(trimmed);
			if (generation !== searchGeneration) return;
			searchResults = results;
			resultGroups = groups;
		} catch (err) {
			if (generation !== searchGeneration) return;
			console.error('Search error:', err);
			error = err.message;
		} finally {
			if (generation === searchGeneration) {
				loading = false;
			}
		}
	}

	function scheduleSearch() {
		if (searchDebounce) clearTimeout(searchDebounce);
		searchDebounce = setTimeout(() => runSearch(searchQuery), 250);
	}

	function handleSearch() {
		if (searchDebounce) clearTimeout(searchDebounce);
		runSearch(searchQuery);
	}

	function handleResultClick(result) {
		const action = result.action;

		if (action === RESULT_ACTIONS.COPY) {
			navigator.clipboard?.writeText(result.title);
			return;
		}

		if (action === RESULT_ACTIONS.SEARCH_WEB && result.url) {
			searchQuery = result.url;
			runSearch(result.url);
			return;
		}

		if (action === RESULT_ACTIONS.NAVIGATE && result.url?.startsWith('/')) {
			goto(result.url);
			return;
		}

		if (result.url) {
			window.open(result.url, '_blank', 'noopener,noreferrer');
		}
	}

	function activateSelected() {
		if (selectedIndex >= 0 && flatResults[selectedIndex]) {
			handleResultClick(flatResults[selectedIndex]);
		} else {
			handleSearch();
		}
	}

	function handleKeydown(event) {
		if (event.key === 'Enter') {
			event.preventDefault();
			activateSelected();
			return;
		}

		if (event.key === 'ArrowDown') {
			event.preventDefault();
			if (flatResults.length === 0) return;
			selectedIndex = Math.min(selectedIndex + 1, flatResults.length - 1);
			return;
		}

		if (event.key === 'ArrowUp') {
			event.preventDefault();
			if (flatResults.length === 0) return;
			selectedIndex = Math.max(selectedIndex - 1, 0);
			return;
		}

		if (event.key === 'Escape') {
			closePage();
		}
	}

	function handleInput() {
		scheduleSearch();
	}
</script>

<div class="page-holder">
	<div class="pt-4 px-4 flex flex-col h-screen page" class:page-exit={isExiting}>
		<div class="flex-shrink-0 pb-4 overflow-hidden">
			<span class="text-5xl font-[300] truncate leading-tight block">
				{finalSearchQuery || 'search'}
			</span>
		</div>

		<div class="flex-1 overflow-y-auto min-h-0">
			<SearchResults
				results={searchResults}
				groups={resultGroups}
				{loading}
				{error}
				onResultClick={handleResultClick}
				{finalSearchQuery}
				{selectedIndex}
			/>
		</div>
	</div>
</div>

{#if showSearchBar}
	<div
		class="fixed left-0 right-0 z-50"
		style="bottom: {navbarHeight}px;"
		in:slide={{ duration: 300, axis: 'y' }}
		out:slide={{ duration: 200, axis: 'y' }}
	>
		<div class="flex flex-row">
			<div class="flex-1 relative">
				<input
					type="text"
					class="w-full h-12 bg-white text-xl text-black pl-4 pr-12 focus:outline-none"
					bind:value={searchQuery}
					on:input={handleInput}
					on:keydown={handleKeydown}
					placeholder="apps, settings, math, web…"
					autocomplete="off"
					autocapitalize="off"
					spellcheck="false"
				/>
			</div>

			<button
				class="w-12 h-12 {textClass} flex justify-center items-center"
				style="background-color: {accentColor};"
				on:click={handleSearch}
				disabled={loading && flatResults.length === 0}
			>
				{#if loading && flatResults.length === 0}
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
