<script>
	import { formatUrl, getFaviconUrl } from '../../lib/search-utils.js';
	import Icon from '@iconify/svelte';
	import Loader from '../../components/Loader.svelte';
	import Button from '../../components/Button.svelte';

	export let results = [];
	export let loading = false;
	export let error = null;
	export let onResultClick = null;
	export let finalSearchQuery = '';

	function handleResultClick(result) {
		if (onResultClick) {
			onResultClick(result);
		} else {
			// Default behavior: open in new tab
			window.open(result.url, '_blank', 'noopener,noreferrer');
		}
	}

	function formatDescription(description) {
		// Truncate long descriptions
		if (description && description.length > 200) {
			return description.substring(0, 200) + '...';
		}
		return description || '';
	}
</script>

<div>
	{#if loading}
		<div class="flex items-center justify-center py-24 mt-12">
			<Loader />
		</div>
	{:else if error}
		<div class="flex flex-col items-start justify-center py-12 text-left">
			<Icon icon="material-symbols:error-outline" class="w-16 h-16 text-red-500" />
			<p class="text-red-400 mb-4 text-lg">{error}</p>
			<Button text="try again" onClick={() => window.location.reload()} />
		</div>
	{:else if results.length === 0}
		{#if finalSearchQuery.trim() !== ''}
			<div class="flex flex-col items-start justify-center py-12 text-center">
				<Icon icon="material-symbols:search-off" class="w-16 h-16 text-gray-500 mb-4" />
				<p class="text-gray-400">No results found</p>
				<p class="text-sm text-gray-500 mt-2">
					Try different keywords or check your search engine settings
				</p>
			</div>
		{/if}
	{:else}
		<div class="space-y-4 flex flex-col h-full pb-24">
			{#each results as result, index}
				<div
					class="search-result py-2"
					on:click={() => handleResultClick(result)}
					on:keydown={(e) => e.key === 'Enter' && handleResultClick(result)}
					role="button"
					tabindex="0"
				>
					<div class="flex items-start gap-3">
						<!-- Favicon -->

						<!-- Content -->
						<div class="flex-1 min-w-0">
							<!-- Title -->
							<div class="flex items-center gap-2">
								<h3
									class="text-lg font-medium text-white mb-1 line-clamp-2 hover:text-blue-400 transition-colors"
								>
									{result.title}
								</h3>
							</div>

							<!-- URL -->
							<p class="text-sm text-green-400 mb-2 font-mono">
								{formatUrl(result.url)}
							</p>

							<!-- Description -->
							{#if result.description}
								<p class="text-gray-300 text-sm leading-relaxed">
									{formatDescription(result.description)}
								</p>
							{/if}

							<!-- Engine badge -->
							<div class="flex items-center gap-2 mt-2">
								<span class="text-sm text-gray-500 font-[400] flex items-center gap-2 justify-center py-1">
									<div class="flex-shrink-0">
										{#if result.favicon}
											<img
												src={result.favicon}
												alt=""
												class="w-4 h-4"
												on:error={(e) => (e.target.style.display = 'none')}
											/>
										{:else}
											<Icon icon="material-symbols:language" class="w-3 h-3 text-gray-500" />
										{/if}
									</div>
									{result.engine}
								</span>
								{#if result.category && result.category !== 'general'}
									<span class="text-xs text-gray-200 py-1">
										{result.category}
									</span>
								{/if}
							</div>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.line-clamp-2 {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>
