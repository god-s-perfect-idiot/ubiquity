<script>
	import { onMount, onDestroy } from 'svelte';
	import { settingsStore } from '../../store/settings.js';
	import { weatherStore } from '../../store/weather.js';
	import { weatherActions } from '../../lib/weather-actions.js';
	import {
		getWeatherIconUrl,
		formatWindDirection,
		formatTime,
		formatDate
	} from '../../lib/weather-utils.js';
	import Icon from '@iconify/svelte';
	import Loader from '../../components/Loader.svelte';

	console.log('WeatherDisplay component loading...');
	console.log('Settings store:', settingsStore);
	console.log('Weather actions:', weatherActions);

	export let locationTitle;

	// Auto-detect location and fetch weather on component mount
	$: if (!weatherStore.getCurrentState().lastLocation && !weatherStore.getCurrentState().error && !weatherStore.getCurrentState().loading) {
		weatherActions.autoDetectAndFetch();
	}

	// Refresh weather data based on settings interval
	let refreshInterval;

	onMount(() => {
		const interval = settingsStore.get('weather.refreshInterval') * 60 * 1000; // Convert to milliseconds
		refreshInterval = setInterval(() => {
			const weatherState = weatherStore.getCurrentState();
			if (weatherState.lastLocation && settingsStore.get('weather.autoRefresh')) {
				weatherActions.refresh();
			}
		}, interval);
	});

	onDestroy(() => {
		if (refreshInterval) {
			clearInterval(refreshInterval);
		}
	});

	function handleRefresh() {
		weatherActions.refresh();
	}

	function handleRetry() {
		weatherActions.autoDetectAndFetch();
	}

	async function handleEnableLocation() {
		console.log('Enable location button clicked...');
		await weatherActions.enableLocationServices();
	}
	
	async function handleCheckPermissions() {
		console.log('Checking location permissions...');
		
		if (navigator.permissions && navigator.permissions.query) {
			try {
				const permission = await navigator.permissions.query({ name: 'geolocation' });
				console.log('Permission state:', permission.state);
				
				if (permission.state === 'granted') {
					console.log('Permission granted, refreshing weather...');
					await weatherActions.refresh();
				} else if (permission.state === 'prompt') {
					console.log('Permission prompt, requesting location...');
					await weatherActions.autoDetectAndFetch();
				} else {
					console.log('Permission denied, showing error...');
					settingsStore.setWeatherError('Location permission denied. Please enable location access in your browser settings.');
				}
			} catch (error) {
				console.log('Permission API error:', error);
				await weatherActions.autoDetectAndFetch();
			}
		} else {
			console.log('Permissions API not available, trying location request...');
			await weatherActions.autoDetectAndFetch();
		}
	}
	
	function handleClearCache() {
		console.log('Clearing weather cache...');
		// Clear weather data
		weatherStore.clear();
		// Force a fresh start
		weatherActions.autoDetectAndFetch();
	}

	// Unit formatting functions
	function getTemperatureUnit() {
		return currentWeather?.temperatureUnit === 'fahrenheit' ? '°F' : '°C';
	}

	function getWindSpeedUnit() {
		const unit = currentWeather?.windSpeedUnit || 'kmh';
		switch (unit) {
			case 'mph': return 'mph';
			case 'ms': return 'm/s';
			default: return 'km/h';
		}
	}

	function getPressureUnit() {
		return currentWeather?.pressureUnit === 'inHg' ? 'inHg' : 'hPa';
	}

	// Reactive variables for weather data - use weather store subscription for real-time updates
	let currentWeather, forecast, location, error, loading;
	$: locationTitle = currentWeather?.city || location?.city || 'Unknown Location';
	
	// Subscribe to weather store for real-time updates and initialize weather
	onMount(() => {
		console.log('WeatherDisplay mounted, setting up weather store subscription...');
		
		// Subscribe to weather store changes
		const unsubscribe = weatherStore.subscribe((state) => {
			currentWeather = state.currentWeather;
			forecast = state.forecast;
			location = state.lastLocation;
			error = state.error;
			loading = state.loading;
			
			console.log('Weather state updated:', { currentWeather, forecast, location, error, loading });
		});
		
		// Get initial state
		const initialState = weatherStore.getCurrentState();
		currentWeather = initialState.currentWeather;
		forecast = initialState.forecast;
		location = initialState.lastLocation;
		error = initialState.error;
		loading = initialState.loading;
		
		console.log('Initial weather state:', { currentWeather, forecast, location, error, loading });
		
		// Clear any old errors and force a fresh start
		if (error && error.includes('API key')) {
			console.log('Clearing old API key error...');
			weatherStore.clearError();
		}
		
		// Check if location name needs updating (if it's "Unknown Location")
		if (currentWeather && currentWeather.city === 'Unknown Location') {
			console.log('Weather data exists but location is unknown, updating location...');
			weatherActions.updateLocationOnly();
		}
		
		// If no weather data and no error, start the process
		if (!currentWeather && !error && !location) {
			console.log('Starting weather detection...');
			weatherActions.autoDetectAndFetch();
		} else if (location && !currentWeather && !error) {
			console.log('Location exists but no weather data, refreshing...');
			weatherActions.refresh();
		} else {
			console.log('Not starting weather detection:', { currentWeather: !!currentWeather, error: !!error, location: !!location });
		}
		
		// Cleanup subscription on unmount
		return unsubscribe;
	});
	
	// Debug logging
	$: console.log('Weather state reactive:', { currentWeather, forecast, location, error, loading });
</script>

<div class="w-full">
	{#if loading}
		<div class="flex flex-col items-center justify-center py-12 h-full my-24">
			<Loader />
		</div>
	{:else if error}
		<div class="flex flex-col items-start justify-center py-12 text-left">
			<Icon icon="material-symbols:error-outline" class="w-16 h-16 text-red-500 mb-4" />
			<p class="text-lg text-red-400 mb-6 max-w-xs">{error}</p>
			<div class="flex flex-row gap-4 w-full flex-wrap">
				<button class="border-2 border-white px-2 py-1 flex flex-row gap-2 justify-center items-center text-base" on:click={handleRetry}>
					<span class="flex justify-center items-center">retry</span>
				</button>
				<button class="border-2 border-white px-2 py-1 flex flex-row gap-2 justify-center items-center text-base" on:click={handleEnableLocation}>
					<span class="flex justify-center items-center">enable location</span>
				</button>
				<button class="border-2 border-white px-2 py-1 flex flex-row gap-2 justify-center items-center text-base" on:click={handleCheckPermissions}>
					<span class="flex justify-center items-center">check permissions</span>
				</button>
				<button class="border-2 border-white px-2 py-1 flex flex-row gap-2 justify-center items-center text-base" on:click={handleClearCache}>
					<span class="flex justify-center items-center">clear cache</span>
				</button>
			</div>
		</div>
	{:else if currentWeather}
		<!-- Current Weather -->
		<div class="space-y-6">
			<div class="text-left">
				<p class="text-lg text-gray-300 mb-2">{currentWeather.country}</p>
				<p class="text-sm text-gray-400">
					Last updated: {new Date(currentWeather.timestamp).toLocaleTimeString()}
				</p>
			</div>

			<div class="text-left">
				<div class="flex items-center justify-start gap-2 mb-4">
					<img
						src={getWeatherIconUrl(currentWeather.icon)}
						alt={currentWeather.description}
						class="w-20 h-20"
					/>
					<div class="flex flex-col items-start">
						<span class="text-5xl font-bold text-white">{currentWeather.temperature}{getTemperatureUnit()}</span>
						<span class="text-lg text-gray-300">Feels like {currentWeather.feelsLike}{getTemperatureUnit()}</span>
					</div>
				</div>

				<p class="text-xl text-gray-200 capitalize">{currentWeather.description}</p>
			</div>

			<div class="space-y-1">
				<div class="flex items-center justify-between p-3 bg-blue-900">
					<Icon icon="material-symbols:water-drop" class="w-6 h-6 text-blue-400" />
					<span class="text-gray-300">Humidity</span>
					<span class="text-white font-medium">{currentWeather.humidity}%</span>
				</div>

				<div class="flex items-center justify-between p-3 bg-purple-800">
					<Icon icon="material-symbols:air" class="w-6 h-6 text-purple-400" />
					<span class="text-gray-300">Wind</span>
					<span class="text-white font-medium"
						>{currentWeather.windSpeed} {getWindSpeedUnit()} {formatWindDirection(
							currentWeather.windDirection
						)}</span
					>
				</div>

				<div class="flex items-center justify-between p-3 bg-green-800">
					<Icon icon="material-symbols:compress" class="w-6 h-6 text-green-400" />
					<span class="text-gray-300">Pressure</span>
					<span class="text-white font-medium">{currentWeather.pressure} {getPressureUnit()}</span>
				</div>
			</div>

			<div class="flex gap-3">
				<button class="px-2 border-2 border-white flex items-center justify-center gap-1 py-2 text-white" on:click={handleRefresh}>
					<Icon icon="material-symbols:refresh" />
					<span class="text-base">refresh</span>
				</button>
				<button class="px-2 border-2 border-white flex items-center justify-center gap-1 py-2 text-white" on:click={() => weatherActions.updateLocationOnly()}>
					<Icon icon="material-symbols:location-on" />
					<span class="text-base">update location</span>
				</button>
			</div>
		</div>
	{:else}
		<div class="text-center py-12 text-gray-400">
			<p>No weather data available</p>
		</div>
	{/if}
</div>
