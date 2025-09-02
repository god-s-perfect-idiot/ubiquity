<script>
	import { settingsStore } from '../../store/settings.js';
	import { getWeatherIconUrl, formatDate, formatTime } from '../../lib/weather-utils.js';

	// Debug logging
	$: console.log('Forecast data:', settingsStore.getWeatherForecast());

	// Function to get background color based on weather description
	function getWeatherBackgroundColor(description) {
		const weather = description.toLowerCase();
		if (weather.includes('clear') || weather.includes('sunny')) {
			return 'bg-yellow-400 !text-black';
		} else if (weather.includes('rain') || weather.includes('drizzle') || weather.includes('shower')) {
			return 'bg-gray-600 !text-white';
		} else if (weather.includes('overcast') || weather.includes('cloudy')) {
			return 'bg-gray-200 !text-black';
		} else if (weather.includes('snow') || weather.includes('blizzard')) {
			return 'bg-blue-200 !text-black';
		} else if (weather.includes('fog') || weather.includes('mist')) {
			return 'bg-gray-500 !text-white';
		} else if (weather.includes('thunderstorm') || weather.includes('storm')) {
			return 'bg-purple-600 !text-white';
		} else if (weather.includes('partly cloudy')) {
			return 'bg-gray-400 !text-white';
		} else {
			return 'bg-gray-600 !text-white'; // Default fallback
		}
	}

	// Group forecast by day and get daily averages
	$: dailyForecast = settingsStore.getWeatherForecast().reduce((acc, item) => {
		// Ensure datetime is a proper Date object
		const datetime = item.datetime instanceof Date ? item.datetime : new Date(item.datetime);
		const date = formatDate(datetime);
		
		if (!acc[date]) {
			acc[date] = {
				date: date,
				day: datetime.toLocaleDateString('en-US', { weekday: 'short' }),
				items: [],
				avgTemp: 0,
				avgHumidity: 0,
				mostCommonIcon: item.icon,
				mostCommonDescription: item.description
			};
		}
		acc[date].items.push(item);
		return acc;
	}, {});

	// Calculate daily averages
	$: Object.values(dailyForecast).forEach(day => {
		if (day.items.length > 0) {
			day.avgTemp = Math.round(
				day.items.reduce((sum, item) => sum + item.temperature, 0) / day.items.length
			);
			day.avgHumidity = Math.round(
				day.items.reduce((sum, item) => sum + item.humidity, 0) / day.items.length
			);
			
			// Find most common weather condition for the day
			const iconCounts = {};
			const descCounts = {};
			day.items.forEach(item => {
				iconCounts[item.icon] = (iconCounts[item.icon] || 0) + 1;
				descCounts[item.description] = (descCounts[item.description] || 0) + 1;
			});
			
			day.mostCommonIcon = Object.keys(iconCounts).reduce((a, b) => 
				iconCounts[a] > iconCounts[b] ? a : b
			);
			day.mostCommonDescription = Object.keys(descCounts).reduce((a, b) => 
				descCounts[a] > descCounts[b] ? a : b
			);
		}
	});

	// Convert to array and sort by date
	$: forecastArray = Object.values(dailyForecast).sort((a, b) => {
		const dateA = a.items[0]?.datetime instanceof Date ? a.items[0].datetime : new Date(a.items[0]?.datetime);
		const dateB = b.items[0]?.datetime instanceof Date ? b.items[0].datetime : new Date(b.items[0]?.datetime);
		return dateA - dateB;
	});
</script>

{#if settingsStore.getWeatherForecast().length > 0}
	<div class="mt-8 mb-14">
		<h3 class="text-2xl font-[300] mb-6 text-left">5 day forecast</h3>
		
		<div class="grid grid-cols-1 gap-1">
			{#each forecastArray as day}
				<div class=" px-4 py-2 text-center flex flex-row gap-4 justify-between items-center {getWeatherBackgroundColor(day.mostCommonDescription)}">
					<div class="flex flex-col gap-1 text-left">
						<span class="block text-sm font-semibold mb-1">{day.date}</span>
						<div class="flex flex-row gap-2 items-center justify-center">
							<span class="flex text-base">{day.avgTemp}°C</span>
							<span class="flex text-base">Humidity: {day.avgHumidity}%</span>
						</div>
					</div>
					
					<div class="flex flex-col items-center">
						<img 
							src={getWeatherIconUrl(day.mostCommonIcon)} 
							alt={day.mostCommonDescription}
							class="w-16 h-16"
						/>
						<span class="block text-base font-semibold">{day.mostCommonDescription}</span>
						<!-- <div class="text-xl font-bold">
							<span>{day.avgTemp}°C</span>
						</div> -->
					</div>
				</div>
			{/each}
		</div>
	</div>
{/if}
