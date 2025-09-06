<script>
	import { onMount } from 'svelte';
	import { settingsStore } from '../../store/settings.js';
	import { searchActions } from '../../lib/search-actions.js';
	import Select from '../../components/Select.svelte';
	import Button from '../../components/Button.svelte';
	import Loader from '../../components/Loader.svelte';
	import Switch from '../../components/Switch.svelte';
	import { addToast } from '../../store/toast';

	export let isExiting = false;

	let loading = true;
	let searchSettings = {};
	let availableEngines = [];
	let selectedEngine = 'DUCKDUCKGO';
	let maxResults = '10';
	let safeSearch = true;
	let isInitialized = false;

	onMount(async () => {
		// Refresh settings from localStorage to get latest values
		settingsStore.refreshFromStorage();
		
		// Load search settings
		searchSettings = searchActions.getSettings();
		availableEngines = searchActions.getAvailableEngines();
		
		// Set form values
		selectedEngine = searchSettings.defaultEngine;
		maxResults = searchSettings.maxResults.toString();
		safeSearch = searchSettings.safeSearch;
		
		loading = false; d
		isInitialized = true; // Allow reactive statements to work
	});

	async function handleEngineChange(newEngine) {
		selectedEngine = newEngine;
		searchActions.setDefaultEngine(newEngine);
	}

	function handleMaxResultsChange(newValue) {
		maxResults = newValue;
		const intValue = parseInt(newValue);
		searchActions.updateSettings({ 'search.maxResults': intValue });
	}





	async function testSearchEngine() {
		const isWorking = await searchActions.testEngine(selectedEngine);
		if (isWorking) {
			addToast(`${selectedEngine} is working correctly!`);
		} else {
			addToast(`${selectedEngine} is not responding`);
		}
	}
</script>

<div class="page-holder">
	<div class="page pt-4 px-4 flex flex-col h-screen" class:page-exit={isExiting}>
		<span class="text-6xl font-[300]">search</span>
		<div class="flex flex-col gap-4 mt-6 pb-10 flex-1 overflow-y-auto">
			{#if loading}
				<div class="flex flex-col items-center justify-center py-12 h-full my-24">
					<Loader />
				</div>
			{:else}
				<!-- Search Engine Selection -->
				<div class="flex flex-col gap-1">
					<Select 
						bind:selection={selectedEngine} 
						data={availableEngines.map(engine => engine.key)} 
						label="default search engine"
						onSelectionChange={handleEngineChange}
                        className="lowercase"
					/>
					<div class="flex flex-col gap-2 mt-4">
						<Button
							text="test engine"
							onClick={testSearchEngine}
						/>
						<span class="text-sm text-[#a1a1a1]">Test if the selected engine is working</span>
					</div>
				</div>

				<!-- Search Results Settings -->
				<div class="flex flex-col gap-1">
					<Select 
						key={maxResults}
						bind:selection={maxResults} 
						data={['5', '10', '15', '20', '25']} 
						label="max results per search"
						onSelectionChange={handleMaxResultsChange}
					/>
				</div>



				<!-- Privacy Settings -->
				<div class="flex flex-col gap-4 mt-4">
					<span class="text-xl font-[300] text-[#a1a1a1]">privacy settings</span>
					
			<Switch
				title="Safe Search"
				description="Filter out explicit content when browsing the web."
				bind:value={safeSearch}
				onToggle={(value) => {
					searchActions.updateSettings({ 'search.safeSearch': value });
				}}
			/>

				</div>
			{/if}
		</div>
	</div>
</div>
