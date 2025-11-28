<script>
	import { onMount } from 'svelte';
	import { accentColorStore, backgroundThemeStore } from '../../utils/theme';

	export let isExiting = false;

	$: accentColor = $accentColorStore;
	$: backgroundTheme = $backgroundThemeStore;

	// Storage categories mapping
	const categoryMap = {
		'ubiquity-app-info': 'apps+games',
		'ubiquity-homescreen-config': 'homescreen',
		'system_settings': 'settings',
		'fileSystemState': 'files',
		'spotify_access_token': 'accounts',
		'spotify_refresh_token': 'accounts',
		'spotify_expires_at': 'accounts',
		'spotify_user': 'accounts'
	};

	let storageData = {
		total: 0,
		used: 0,
		free: 0,
		categories: {}
	};

	let isUpdating = true;
	let barsReady = false;

	// Calculate size of a string in bytes
	function getSizeInBytes(str) {
		return new Blob([str]).size;
	}

	// Format bytes to human readable
	function formatBytes(bytes) {
		if (bytes === 0) return '0 bytes';
		if (bytes < 1024) return bytes + ' bytes';
		if (bytes < 1024 * 1024) {
			return (bytes / 1024).toFixed(2) + ' KB';
		}
		if (bytes < 1024 * 1024 * 1024) {
			return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
		}
		return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
	}

	// Calculate storage usage
	async function calculateStorage() {
		if (typeof window === 'undefined' || !window.localStorage) return;

		isUpdating = true;
		
		// Try to get actual localStorage quota
		// localStorage is typically 5-10MB depending on browser
		let quota = 10 * 1024 * 1024; // Default 10MB (common limit)
		try {
			if ('storage' in navigator && 'estimate' in navigator.storage) {
				const estimate = await navigator.storage.estimate();
				if (estimate.quota) {
					// localStorage is usually a small portion of total quota
					// Most browsers limit localStorage to 5-10MB
					// Use the smaller of: 10MB or 2% of total quota (as localStorage is typically 1-2% of total)
					quota = Math.min(10 * 1024 * 1024, estimate.quota * 0.02);
				}
			}
		} catch (e) {
			console.warn('Could not get storage quota:', e);
		}
		
		// Reset storage data to trigger animations
		storageData = {
			total: quota,
			used: 0,
			free: quota,
			categories: {}
		};
		
		// Wait a frame to ensure bars start at 0
		await new Promise(resolve => requestAnimationFrame(resolve));
		
		let totalUsed = 0;
		const categories = {};

		// Iterate through all localStorage items
		for (let i = 0; i < localStorage.length; i++) {
			const key = localStorage.key(i);
			const value = localStorage.getItem(key);
			const size = getSizeInBytes(key) + getSizeInBytes(value);
			
			totalUsed += size;
			
			// Categorize
			let category = 'other';
			if (categoryMap[key]) {
				category = categoryMap[key];
			} else if (key.includes('_access_token') || key.includes('_user') || key.includes('_refresh_token') || key.includes('_expires_at')) {
				category = 'accounts';
			} else if (key.includes('weather') || key.includes('Weather')) {
				category = 'weather';
			} else if (key.includes('grid') || key.includes('Grid')) {
				category = 'homescreen';
			}
			
			if (!categories[category]) {
				categories[category] = 0;
			}
			categories[category] += size;
		}

		// Calculate free space
		const free = Math.max(0, quota - totalUsed);

		// Update with actual values to trigger animations
		storageData = {
			total: quota,
			used: totalUsed,
			free: free,
			categories: categories
		};

		// Wait a bit then enable bar animations
		setTimeout(() => {
			barsReady = true;
		}, 100);

		// Simulate updating state
		setTimeout(() => {
			isUpdating = false;
		}, 500);
	}

	// Get category display name
	function getCategoryName(key) {
		const names = {
			'apps+games': 'apps+games',
			'homescreen': 'homescreen',
			'settings': 'settings',
			'files': 'files',
			'accounts': 'accounts',
			'weather': 'weather',
			'other': 'other'
		};
		return names[key] || key;
	}

	// Get sorted categories by size
	$: sortedCategories = Object.entries(storageData.categories)
		.map(([key, size]) => ({ name: key, size }))
		.sort((a, b) => b.size - a.size);

	// Calculate percentage for progress bar
	function getPercentage(size, total) {
		if (total === 0) return 0;
		return (size / total) * 100;
	}

	onMount(() => {
		calculateStorage();
	});
</script>

<div class="page-holder">
	<div class="page pt-4 px-4 flex flex-col h-screen" class:page-exit={isExiting}>
		<span class="text-6xl font-[300]">storage</span>
		<div class="flex flex-col gap-6 mt-8 flex-1 overflow-y-auto pb-16">
			<div class="flex flex-col gap-2">
				<span class="text-3xl font-[300]">local storage</span>
				<div class="flex flex-row justify-between items-center">
					<span class="text-xl font-[300]">{formatBytes(storageData.used)} used</span>
					<span class="text-xl font-[300]">{formatBytes(storageData.free)} free</span>
				</div>
				<!-- Progress bar -->
				<div class="w-full h-2 bg-[#2a2a2a] mt-2 overflow-hidden">
					<div
						class="h-full {barsReady ? 'progress-bar' : ''}"
						style="width: {barsReady ? getPercentage(storageData.used, storageData.total) : 0}%; background-color: {accentColor};"
					></div>
				</div>
			</div>

			<div class="flex flex-col gap-4 mt-4">
				{#each sortedCategories as category}
					{@const percentage = getPercentage(category.size, storageData.used)}
					<div class="flex flex-col gap-1">
						<div class="flex flex-row justify-between items-center">
							<span class="text-base font-[300]">{getCategoryName(category.name)}</span>
							<span class="text-base font-[300] text-[#a1a1a1]">
								{formatBytes(category.size)}
								{#if isUpdating}
									<span class="ml-1">, updating...</span>
								{/if}
							</span>
						</div>
						<!-- Category progress bar -->
						<div class="w-full h-1 bg-[#2a2a2a] mt-1 overflow-hidden">
							<div
								class="h-full {barsReady ? 'progress-bar' : ''}"
								style="width: {barsReady ? percentage : 0}%; background-color: {accentColor};"
							></div>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</div>
</div>

<style>
	.page {
		height: 100%;
		width: 100%;
	}

	.progress-bar {
		transition: width 0.8s ease-out;
		transform-origin: left;
	}
</style>

