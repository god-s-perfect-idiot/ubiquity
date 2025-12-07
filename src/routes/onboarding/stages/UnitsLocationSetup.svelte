<script>
	import {
		accentColorStore,
		textColorClassStore,
		backgroundThemeStore
	} from '../../../utils/theme';
	import { settingsStore } from '../../../store/settings';
	import { weatherStore } from '../../../store/weather';
	import Select from '../../../components/Select.svelte';
	import Button from '../../../components/Button.svelte';
	import Input from '../../../components/Input.svelte';
	import { getCityName } from '../../../lib/weather-utils';
	import Loader from '../../../components/Loader.svelte';
	import { weatherActions } from '../../../lib/weather-actions';
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';

	$: accentColor = $accentColorStore;
	$: textClass = $textColorClassStore;
	$: background = $backgroundThemeStore;

	let location = { city: 'not detected', country: 'not detected' };
	let units = 'Metric';
	let userName = '';
	let loading = false;
	let isDetecting = false;
	let isMounted = false;
	let lastLocationCoords = null; // Track last location to avoid unnecessary updates
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
		units = newUnits;
		// Update region in store (this will also update all weather units)
		const success = settingsStore.setRegion(newUnits);
		if (success) {
			// Refresh weather data with new units if location exists
			const weatherState = weatherStore.getCurrentState();
			if (weatherState.lastLocation) {
				await weatherActions.refresh();
			}
		}
	}

	// Function to detect location
	async function detectLocation() {
		try {
			isDetecting = true;
			loading = true;
			await weatherActions.autoDetectAndFetch();
			// Location will be updated automatically via store subscription
		} catch (error) {
			console.error('Failed to detect location:', error);
			location = { city: 'Failed to detect', country: 'Please try again' };
			loading = false;
			isDetecting = false;
		}
	}

	// Handle user name change - save to localStorage when it changes (but not on initial mount)
	$: if (browser && isMounted && userName !== undefined) {
		if (userName.trim()) {
			localStorage.setItem('ubiquity-user-name', userName.trim());
		} else {
			localStorage.removeItem('ubiquity-user-name');
		}
	}

	onMount(async () => {
		// Load user name from localStorage
		if (browser) {
			userName = localStorage.getItem('ubiquity-user-name') || '';
		}

		// Initial location load
		await updateLocationFromStore();

		// Load current region setting
		units = settingsStore.getRegion() || 'Metric';

		// Mark as mounted so reactive statement can save changes
		isMounted = true;

		// Subscribe to weather store changes for reactive updates
		unsubscribe = weatherStore.subscribe(async (state) => {
			// Check if location has changed
			const currentLocation = state.lastLocation;
			if (currentLocation) {
				// Only update if coordinates actually changed
				const coordsChanged =
					!lastLocationCoords ||
					lastLocationCoords.lat !== currentLocation.lat ||
					lastLocationCoords.lon !== currentLocation.lon;

				if (coordsChanged) {
					lastLocationCoords = { lat: currentLocation.lat, lon: currentLocation.lon };
					await updateLocationFromStore();
					isDetecting = false;
				}
			} else {
				location = { city: 'not detected', country: 'not detected' };
				loading = false;
				isDetecting = false;
				lastLocationCoords = null;
			}
		});

		// Subscribe to settings store for region changes
		settingsUnsubscribe = settingsStore.subscribe(async (state) => {
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

<div class="flex flex-col gap-4 items-start justify-start w-full h-full">
	<span class="text-lg text-left w-full font-semibold {textClass}">PERSONAL DATA</span>

	<p class="text-lg {textClass}">
		Set up your personal information, location, and preferred units.
	</p>

	<!-- Location -->
	<div class="flex flex-col w-full mt-2">
		<span class="text-lg font-[400]" style="color: {accentColor};">location</span>

		{#if loading || isDetecting}
			<div class="flex flex-col items-center justify-center py-8 mt-4">
				<Loader />
			</div>
		{:else}
			<div class="flex flex-col gap-2 mt-4">
				<span class="text-sm font-[300] text-[#767676]">Current Location</span>
				<span class="text-xl font-[300]">
					{location.city}, {location.country}
				</span>
				<Button text="detect location" onClick={detectLocation} className="mt-2 w-fit" />
				<span class="text-sm font-[300] text-[#a1a1a1] mt-1">
					This will detect your location and fetch weather data.
				</span>
			</div>
		{/if}
	</div>
	<!-- User Name -->
	<div class="flex flex-col w-full mt-2">
		<span class="text-lg font-[400]" style="color: {accentColor};">user information</span>

		<div class="flex flex-col gap-2 mt-4">
			<Input bind:content={userName} label="Username" />
			<span class="text-sm font-[300] text-[#a1a1a1]">
				Set your username for publishing live tiles and other content.
			</span>
		</div>
	</div>

	<!-- Units -->
	<div class="flex flex-col w-full mt-2">
		<span class="text-lg font-[400]" style="color: {accentColor};">units</span>

		<Select
			label="Measurement System"
			data={['Imperial', 'Metric']}
			bind:selection={units}
			onSelectionChange={handleUnitsChange}
			className="mt-4"
		/>
		<span class="text-sm font-[300] text-[#a1a1a1] mt-2">
			Imperial uses Fahrenheit, miles, and pounds. Metric uses Celsius, kilometers, and kilograms.
		</span>
	</div>
</div>
