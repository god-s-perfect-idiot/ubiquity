// Weather utilities for location detection and API calls
// Using Open-Meteo API (completely free, no API key required)
const WEATHER_BASE_URL = 'https://api.open-meteo.com/v1';

/**
 * Get current location using browser geolocation
 * @returns {Promise<{lat: number, lon: number}>}
 */
export async function getCurrentLocation() {
	return new Promise((resolve, reject) => {
		if (!navigator.geolocation) {
			reject(new Error('Geolocation is not supported by this browser'));
			return;
		}

		navigator.geolocation.getCurrentPosition(
			(position) => {
				resolve({
					lat: position.coords.latitude,
					lon: position.coords.longitude
				});
			},
			(error) => {
				reject(new Error(`Geolocation error: ${error.message}`));
			},
			{
				enableHighAccuracy: true,
				timeout: 10000,
				maximumAge: 600000 // 10 minutes
			}
		);
	});
}

/**
 * Get weather data for a specific location
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Promise<Object>}
 */
export async function getWeatherData(lat, lon) {
	const url = `${WEATHER_BASE_URL}/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,pressure_msl,wind_speed_10m,wind_direction_10m,weather_code,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto`;
	
	try {
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`Weather API error: ${response.status}`);
		}
		
		const data = await response.json();
		
		// Get city name from reverse geocoding
		const cityName = await getCityName(lat, lon);
		
		return {
			temperature: Math.round(data.current.temperature_2m),
			feelsLike: Math.round(data.current.apparent_temperature),
			humidity: data.current.relative_humidity_2m,
			pressure: Math.round(data.current.pressure_msl),
			description: getWeatherDescription(data.current.weather_code),
			icon: getWeatherIcon(data.current.weather_code, data.current.is_day),
			windSpeed: Math.round(data.current.wind_speed_10m * 3.6), // Convert m/s to km/h
			windDirection: data.current.wind_direction_10m,
			city: cityName.city || 'Unknown Location',
			country: cityName.country || 'Unknown',
			sunrise: new Date(), // Open-Meteo doesn't provide sunrise/sunset in current endpoint
			sunset: new Date(),  // We'll calculate this or use a different approach
			timestamp: new Date(),
			weatherCode: data.current.weather_code
		};
	} catch (error) {
		throw new Error(`Failed to fetch weather data: ${error.message}`);
	}
}

/**
 * Get weather forecast for a specific location
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Promise<Array>}
 */
export async function getWeatherForecast(lat, lon) {
	const url = `${WEATHER_BASE_URL}/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto`;
	
	try {
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`Weather API error: ${response.status}`);
		}
		
		const data = await response.json();
		
		// Convert hourly data to forecast array
		return data.hourly.time.map((time, index) => ({
			datetime: new Date(time),
			temperature: Math.round(data.hourly.temperature_2m[index]),
			feelsLike: Math.round(data.hourly.apparent_temperature[index]),
			humidity: data.hourly.relative_humidity_2m[index],
			description: getWeatherDescription(data.hourly.weather_code[index]),
			icon: getWeatherIcon(data.hourly.weather_code[index], true), // Assume day for forecast
			windSpeed: Math.round(data.hourly.wind_speed_10m[index] * 3.6),
			windDirection: data.hourly.wind_direction_10m[index],
			weatherCode: data.hourly.weather_code[index]
		}));
	} catch (error) {
		throw new Error(`Failed to fetch weather forecast: ${error.message}`);
	}
}

/**
 * Get city name from coordinates using reverse geocoding
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Promise<{city: string, country: string}>}
 */
async function getCityName(lat, lon) {
	try {
		console.log('Getting city name for coordinates:', { lat, lon });
		
		const response = await fetch(`https://api.open-meteo.com/v1/geocoding/reverse?latitude=${lat}&longitude=${lon}&count=1`);
		console.log('Geocoding response status:', response.status);
		
		if (response.ok) {
			const data = await response.json();
			console.log('Geocoding response data:', data);
			
			if (data.results && data.results.length > 0) {
				const result = data.results[0];
				console.log('Geocoding result:', result);
				
				// Try different possible field names for city and country
				const city = result.name || result.city || result.locality || result.place || 'Unknown Location';
				const country = result.country || result.country_code || 'Unknown';
				
				console.log('Extracted city info:', { city, country });
				
				return { city, country };
			} else {
				console.log('No results in geocoding response');
			}
		} else {
			console.log('Geocoding response not ok:', response.status, response.statusText);
		}
	} catch (error) {
		console.error('Failed to get city name:', error);
	}
	
	// Try fallback geocoding service
	console.log('Primary geocoding failed, trying fallback...');
	const fallbackResult = await getCityNameFallback(lat, lon);
	if (fallbackResult) {
		return fallbackResult;
	}
	
	console.log('Returning default city info');
	return { city: 'Unknown Location', country: 'Unknown' };
}

/**
 * Fallback geocoding using a different free service
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Promise<{city: string, country: string}>}
 */
async function getCityNameFallback(lat, lon) {
	try {
		console.log('Trying fallback geocoding service...');
		
		// Use Nominatim (OpenStreetMap) as a fallback
		const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10`);
		console.log('Fallback geocoding response status:', response.status);
		
		if (response.ok) {
			const data = await response.json();
			console.log('Fallback geocoding data:', data);
			
			if (data.address) {
				const city = data.address.city || data.address.town || data.address.village || data.address.county || 'Unknown Location';
				const country = data.address.country || 'Unknown';
				
				console.log('Fallback extracted city info:', { city, country });
				return { city, country };
			}
		}
	} catch (error) {
		console.error('Fallback geocoding failed:', error);
	}
	
	return null;
}

/**
 * Convert weather code to description
 * @param {number} code - Weather code from Open-Meteo
 * @returns {string} - Weather description
 */
function getWeatherDescription(code) {
	const weatherCodes = {
		0: 'Clear sky',
		1: 'Mainly clear',
		2: 'Partly cloudy',
		3: 'Overcast',
		45: 'Foggy',
		48: 'Depositing rime fog',
		51: 'Light drizzle',
		53: 'Moderate drizzle',
		55: 'Dense drizzle',
		56: 'Light freezing drizzle',
		57: 'Dense freezing drizzle',
		61: 'Slight rain',
		63: 'Moderate rain',
		65: 'Heavy rain',
		66: 'Light freezing rain',
		67: 'Heavy freezing rain',
		71: 'Slight snow fall',
		73: 'Moderate snow fall',
		75: 'Heavy snow fall',
		77: 'Snow grains',
		80: 'Slight rain showers',
		81: 'Moderate rain showers',
		82: 'Violent rain showers',
		85: 'Slight snow showers',
		86: 'Heavy snow showers',
		95: 'Thunderstorm',
		96: 'Thunderstorm with slight hail',
		99: 'Thunderstorm with heavy hail'
	};
	
	return weatherCodes[code] || 'Unknown';
}

/**
 * Convert weather code to icon
 * @param {number} code - Weather code from Open-Meteo
 * @param {boolean} isDay - Whether it's day or night
 * @returns {string} - Icon identifier
 */
function getWeatherIcon(code, isDay) {
	// Map weather codes to icon names
	if (code >= 0 && code <= 3) {
		return isDay ? '01d' : '01n'; // Clear/partly cloudy
	} else if (code >= 45 && code <= 48) {
		return '50d'; // Fog
	} else if (code >= 51 && code <= 57) {
		return '09d'; // Drizzle
	} else if (code >= 61 && code <= 67) {
		return '10d'; // Rain
	} else if (code >= 71 && code <= 77) {
		return '13d'; // Snow
	} else if (code >= 80 && code <= 82) {
		return '09d'; // Rain showers
	} else if (code >= 85 && code <= 86) {
		return '13d'; // Snow showers
	} else if (code >= 95 && code <= 99) {
		return '11d'; // Thunderstorm
	}
	
	return '01d'; // Default to clear day
}

/**
 * Get weather icon URL (using OpenWeatherMap icons for consistency)
 * @param {string} iconCode - Weather icon code
 * @returns {string} - Icon URL
 */
export function getWeatherIconUrl(iconCode) {
	return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
}

/**
 * Format wind direction
 * @param {number} degrees - Wind direction in degrees
 * @returns {string} - Cardinal direction
 */
export function formatWindDirection(degrees) {
	const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
	const index = Math.round(degrees / 22.5) % 16;
	return directions[index];
}

/**
 * Format time
 * @param {Date} date - Date object
 * @returns {string} - Formatted time string
 */
export function formatTime(date) {
	return date.toLocaleTimeString('en-US', { 
		hour: '2-digit', 
		minute: '2-digit',
		hour12: true 
	});
}

/**
 * Format date
 * @param {Date} date - Date object
 * @returns {string} - Formatted date string
 */
export function formatDate(date) {
	return date.toLocaleDateString('en-US', { 
		weekday: 'short', 
		month: 'short', 
		day: 'numeric' 
	});
}
