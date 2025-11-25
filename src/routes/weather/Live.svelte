<script>
	import { onMount } from 'svelte';
	import Icon from '@iconify/svelte';
	import { weatherStore } from '../../store/weather.js';
	import { weatherActions } from '../../lib/weather-actions.js';
	import { getWeatherIconUrl } from '../../lib/weather-utils.js';
	import { accentColorStore, textColorClassStore } from '../../utils/theme';
	import Loader from '../../components/Loader.svelte';

	export let gridSize = '2x2'; // '2x2' or '4x2'

	$: accentColor = $accentColorStore;
	$: textColor = $textColorClassStore;

	let currentWeather = null;
	let forecast = [];
	let loading = false;
	let dailyHigh = null;
	let dailyLow = null;

	onMount(() => {
		// Subscribe to weather store
		const unsubscribe = weatherStore.subscribe((state) => {
			currentWeather = state.currentWeather;
			forecast = state.forecast || [];
			loading = state.loading;

			// Calculate today's high/low from forecast
			calculateDailyHighLow();
		});

		// Get initial state
		const initialState = weatherStore.getCurrentState();
		currentWeather = initialState.currentWeather;
		forecast = initialState.forecast || [];
		loading = initialState.loading;

		// Calculate today's high/low from forecast
		calculateDailyHighLow();

		// If no weather data, try to fetch it
		if (!currentWeather && !loading) {
			weatherActions.autoDetectAndFetch();
		}

		return unsubscribe;
	});

	function calculateDailyHighLow() {
		if (!forecast || forecast.length === 0) {
			dailyHigh = null;
			dailyLow = null;
			return;
		}

		// Get today's date
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		// Filter forecast for today
		const todayForecast = forecast.filter((item) => {
			const itemDate = new Date(item.datetime);
			itemDate.setHours(0, 0, 0, 0);
			return itemDate.getTime() === today.getTime();
		});

		if (todayForecast.length > 0) {
			const temps = todayForecast.map((item) => item.temperature);
			dailyHigh = Math.max(...temps);
			dailyLow = Math.min(...temps);
		} else {
			// If no today's data, use first day's data
			const temps = forecast.slice(0, 24).map((item) => item.temperature);
			if (temps.length > 0) {
				dailyHigh = Math.max(...temps);
				dailyLow = Math.min(...temps);
			}
		}
	}

	function getTemperatureUnit() {
		return currentWeather?.temperatureUnit === 'fahrenheit' ? '°F' : '°C';
	}

	function getWeatherGradient() {
		if (!currentWeather) {
			return 'linear-gradient(135deg, #5ba3f5 0%, #357abd 100%)';
		}

		const description = currentWeather.description.toLowerCase();
		const weatherCode = currentWeather.weatherCode;

		// Clear/Sunny
		if (
			description.includes('clear') ||
			description.includes('sunny') ||
			(weatherCode >= 0 && weatherCode <= 3)
		) {
			return 'linear-gradient(135deg, #87CEEB 0%, #4682B4 50%, #1E90FF 100%)'; // Sky blue gradient
		}

		// Rain/Drizzle
		if (
			description.includes('rain') ||
			description.includes('drizzle') ||
			(weatherCode >= 51 && weatherCode <= 67)
		) {
			return 'linear-gradient(135deg, #708090 0%, #556B2F 50%, #2F4F4F 100%)'; // Grey-green gradient
		}

		// Snow
		if (description.includes('snow') || (weatherCode >= 71 && weatherCode <= 77)) {
			return 'linear-gradient(135deg, #E0E0E0 0%, #B0C4DE 50%, #778899 100%)'; // Light grey-blue gradient
		}

		// Thunderstorm
		if (
			description.includes('thunderstorm') ||
			description.includes('storm') ||
			(weatherCode >= 95 && weatherCode <= 99)
		) {
			return 'linear-gradient(135deg, #4B0082 0%, #2E0854 50%, #1A0033 100%)'; // Dark purple gradient
		}

		// Fog/Mist
		if (
			description.includes('fog') ||
			description.includes('mist') ||
			(weatherCode >= 45 && weatherCode <= 48)
		) {
			return 'linear-gradient(135deg, #C0C0C0 0%, #808080 50%, #696969 100%)'; // Grey gradient
		}

		// Cloudy/Overcast
		if (
			description.includes('cloud') ||
			description.includes('overcast') ||
			(weatherCode >= 2 && weatherCode <= 3)
		) {
			return 'linear-gradient(135deg, #778899 0%, #5F7F8F 50%, #4A5F6F 100%)'; // Cloudy grey-blue gradient
		}

		// Default (blue)
		return 'linear-gradient(135deg, #5ba3f5 0%, #357abd 100%)';
	}

	function formatTime(date) {
		const hours = date.getHours();
		const minutes = date.getMinutes();
		const ampm = hours >= 12 ? 'PM' : 'AM';
		const displayHours = hours % 12 || 12;
		const displayMinutes = minutes.toString().padStart(2, '0');
		return `${displayHours}:${displayMinutes} ${ampm}`;
	}

	function getPressureUnit() {
		return currentWeather?.pressureUnit === 'inHg' ? 'inHg' : 'hPa';
	}

	function getWindSpeedUnit() {
		const unit = currentWeather?.windSpeedUnit || 'kmh';
		switch (unit) {
			case 'mph':
				return 'mph';
			case 'ms':
				return 'm/s';
			default:
				return 'km/h';
		}
	}
</script>

{#if loading}
	<div
		class="w-full h-full flex items-center justify-center text-white {textColor}"
		style="background: linear-gradient(135deg, #4a90e2 0%, #357abd 100%);"
	>
		<Loader />
	</div>
{:else if currentWeather}
	{#if gridSize === '2x2'}
		<!-- 2x2 Tile: Weather display matching Windows Phone style -->
		<div
			class="w-full h-full flex flex-col justify-center text-white {textColor} relative overflow-hidden"
			style="background: {getWeatherGradient()};"
		>
			<!-- Top section: Location, Condition, Icon -->
			<div class="flex flex-row justify-between h-[25%] items-start p-1">
				<div class="flex flex-col items-start">
					<span class="text-lg font-[500]">{currentWeather.city}</span>
					<span class="text-sm font-[300] capitalize opacity-90">{currentWeather.description}</span>
				</div>
			</div>

			<!-- Bottom section: Temperature and High/Low -->
			<div class="flex flex-row justify-start gap-4 h-[75%] items-center ml-4">
				<div class="flex flex-row items-baseline gap-1">
					<span class="text-6xl font-[300]">{currentWeather.temperature}</span>
					<span class="text-base font-[500] self-start">{getTemperatureUnit()}</span>
				</div>
				{#if dailyHigh !== null && dailyLow !== null}
					<div class="flex flex-col items-end">
						<span class="text-base font-[300]">{dailyHigh}°</span>
						<div class="w-8 h-px bg-white opacity-50 my-1"></div>
						<span class="text-base font-[300] opacity-80">{dailyLow}°</span>
					</div>
				{/if}
			</div>
		</div>
	{:else if gridSize === '4x2'}
		<!-- 4x2 Tile: Full weather display with details matching the image -->
		<div
			class="w-full h-full flex flex-row justify-between text-white {textColor} relative overflow-hidden"
			style="background: {getWeatherGradient()};"
		>
			<div class="flex flex-col justify-between h-full p-2">
				<!-- Top section: Location and Updated time -->
				<div class="flex flex-col items-start">
					<span class="text-lg font-[400]">{currentWeather.city}</span>
					<span class="text-sm font-[300] opacity-80"
						>Updated at: {formatTime(currentWeather.timestamp)}</span
					>
				</div>

				<!-- Left side: Temperature and condition -->
				<div class="flex flex-col justify-center h-full">
					<div class="flex flex-row items-baseline gap-2">
						<span class="text-6xl font-[300]">{currentWeather.temperature}</span>
						<span class="text-base font-[500] self-start">{getTemperatureUnit()}</span>
					</div>
				</div>

				<span class="text-base font-[300] capitalize">{currentWeather.description}</span>

			</div>
			<!-- Main content: Temperature and details -->
			<div class="flex flex-row justify-end w-full items-center flex-1 mr-2">
				<!-- Right side: Detailed information with icons -->
				<div class="flex flex-col gap-2 items-end">
					<div class="flex flex-row items-center gap-2">
						<Icon icon="material-symbols:cloud" width="20" height="20" class="opacity-80" />
						<span class="text-base font-[300]">100%</span>
					</div>
					<div class="flex flex-row items-center gap-2">
						<Icon icon="material-symbols:water-drop" width="20" height="20" class="opacity-80" />
						<span class="text-base font-[300]">{currentWeather.humidity}%</span>
					</div>
					<div class="flex flex-row items-center gap-2">
						<Icon icon="material-symbols:compress" width="20" height="20" class="opacity-80" />
						<span class="text-base font-[300]">{currentWeather.pressure} {getPressureUnit()}</span>
					</div>
					<div class="flex flex-row items-center gap-2">
						<Icon icon="material-symbols:air" width="20" height="20" class="opacity-80" />
						<span class="text-base font-[300]">{currentWeather.windSpeed}{getWindSpeedUnit()}</span>
					</div>
				</div>
			</div>
		</div>
	{/if}
{:else}
	<div
		class="w-full h-full flex items-center justify-center text-white {textColor}"
		style="background: {getWeatherGradient()};"
	>
		<span class="text-lg font-[300]">No weather data</span>
	</div>
{/if}
