<script>
	import { onMount, onDestroy } from 'svelte';
	import { settingsStore } from '../../store/settings';
	import { weatherStore } from '../../store/weather';
	export let isExiting = false;
	import Select from '../../components/Select.svelte';
	import Button from '../../components/Button.svelte';
	import { getCityName } from '../../lib/weather-utils';
	import Loader from '../../components/Loader.svelte';
	import { weatherActions } from '../../lib/weather-actions';

	let location = { city: 'not detected', country: 'not detected' };
	let units = 'Metric';
	let loading = true;
	let unsubscribe;
	let settingsUnsubscribe;

	// Function to update location from store
	async function updateLocationFromStore() {
		const weatherState = weatherStore.getCurrentState();
		const coordinates = weatherState.lastLocation;
		if (coordinates) {
			try {
				loading = true;
				const cityInfo = await getCityName(coordinates.lat, coordinates.lon);
				location = cityInfo;
				console.log('Location updated:', location);
			} catch (error) {
				console.error('Failed to get city name:', error);
				location = { city: 'Unknown Location', country: 'Unknown' };
			}
		} else {
			location = { city: 'not detected', country: 'not detected' };
		}
		loading = false;
	}

	// Function to handle units change
	async function handleUnitsChange(newUnits) {
		console.log('Units changed to:', newUnits);
		units = newUnits;
		
		// Update region in store (this will also update all weather units)
		const success = settingsStore.setRegion(newUnits);
		if (success) {
			// Refresh weather data with new units
			const weatherState = weatherStore.getCurrentState();
			if (weatherState.lastLocation) {
				await weatherActions.refresh();
			}
		}
	}

	onMount(async () => {
		// Initial location load
		await updateLocationFromStore();
		
		// Load current region setting
		units = settingsStore.getRegion() || 'Metric';
		
		// Subscribe to weather store changes for reactive updates
		unsubscribe = weatherStore.subscribe(async (state) => {
			// Check if location has changed
			const currentLocation = state.lastLocation;
			if (currentLocation) {
				await updateLocationFromStore();
			} else {
				location = { city: 'not detected', country: 'not detected' };
				loading = false;
			}
		});
		
		// Subscribe to settings store for region changes
		const settingsUnsubscribe = settingsStore.subscribe(async (state) => {
			// Update units if region changed
			const currentRegion = state.settings?.weather?.region;
			if (currentRegion) {
				units = currentRegion;
			}
		});
	});

	onDestroy(() => {
		if (unsubscribe) {
			unsubscribe();
		}
		if (settingsUnsubscribe) {
			settingsUnsubscribe();
		}
	});
</script>

<div class="page-holder">
	<div class="page pt-4 px-4 flex flex-col h-screen" class:page-exit={isExiting}>
		<span class="text-6xl font-[300]">region+units</span>
		<div class="flex flex-col gap-4 mt-12 flex-1 overflow-y-auto">
			{#if loading}
				<div class="flex flex-col items-center justify-center py-12 h-full my-24">
					<Loader />
				</div>
			{:else}
				<div class="flex flex-col gap-1">
					<span class="text-sm font-[300] text-[#a1a1a1]">location</span>
					<span class="text-xl font-[300]">
						{location.city}, {location.country}
					</span>
					<Button
						text="remove data"
						onClick={async () => {
							// Clear weather data and location
							weatherStore.clear();
							// Update location display
							location = { city: 'not detected', country: 'not detected' };
						}}
						className="mt-2"
					/>
					<span class="text-sm font-[300] text-[#a1a1a1] mt-1"
						>This will reset the weather data.</span
					>
					<Button
						text="fetch new location"
						onClick={async () => {
							// Fetch new location and weather data
							await weatherActions.autoDetectAndFetch();
							// The location will be updated automatically via store subscription
						}}
						className="mt-2"
					/>
					<span class="text-sm font-[300] text-[#a1a1a1] mt-1">This will refresh the weather data and fetch a new location.</span>
				</div>
				<Select 
					bind:selection={units} 
					data={['Imperial', 'Metric']} 
					label="units"
					onSelectionChange={handleUnitsChange}
				/>
			{/if}
		</div>
	</div>
</div>
