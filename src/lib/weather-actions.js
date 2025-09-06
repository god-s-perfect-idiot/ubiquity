import { getCurrentLocation, getWeatherData, getWeatherForecast } from './weather-utils.js';
import { settingsStore } from '../store/settings.js';

/**
 * Weather actions that integrate with the settings store
 */
export const weatherActions = {
	/**
	 * Auto-detect location and fetch weather
	 */
	async autoDetectAndFetch() {
		try {
			console.log('Starting weather detection...');
			console.log('Current settings state:', settingsStore.getAll());
			
			// Get current location
			const location = await getCurrentLocation();
			console.log('Location detected:', location);
			
			// Update location in settings
			settingsStore.updateWeatherLocation(location);
			console.log('Location updated in settings');
			
			// Fetch current weather with correct units
			console.log('Fetching weather data...');
			const temperatureUnit = settingsStore.get('weather.temperatureUnit');
			const windSpeedUnit = settingsStore.get('weather.windSpeedUnit');
			const pressureUnit = settingsStore.get('weather.pressureUnit');
			const current = await getWeatherData(location.lat, location.lon, temperatureUnit, windSpeedUnit, pressureUnit);
			console.log('Weather data received:', current);
			
			// Fetch forecast with correct units
			console.log('Fetching forecast...');
			const forecast = await getWeatherForecast(location.lat, location.lon, temperatureUnit, windSpeedUnit);
			console.log('Forecast received:', forecast);
			
			// Update settings with weather data
			settingsStore.updateWeatherData(current, forecast);
			console.log('Weather data updated in settings');
			
			// Enable location services after successful detection
			settingsStore.set('weather.locationServices', true);
			settingsStore.set('weather.autoRefresh', true);
			console.log('Location services enabled');
			
			console.log('Weather setup complete!');
			console.log('Final settings state:', settingsStore.getAll());
			
		} catch (error) {
			console.error('Weather error:', error);
			
			// Handle specific geolocation errors
			if (error.message.includes('denied') || error.message.includes('permission')) {
				settingsStore.setWeatherError('Location permission denied. Please allow location access and try again.');
			} else if (error.message.includes('timeout')) {
				settingsStore.setWeatherError('Location detection timed out. Please try again.');
			} else if (error.message.includes('unavailable')) {
				settingsStore.setWeatherError('Location service unavailable. Please check your device settings.');
			} else {
				settingsStore.setWeatherError(error.message);
			}
		}
	},

	/**
	 * Refresh weather data for current location
	 */
	async refresh() {
		const lastLocation = settingsStore.getLastLocation();
		if (lastLocation) {
			try {
				// Fetch current weather with correct units
				const temperatureUnit = settingsStore.get('weather.temperatureUnit');
				const windSpeedUnit = settingsStore.get('weather.windSpeedUnit');
				const pressureUnit = settingsStore.get('weather.pressureUnit');
				const current = await getWeatherData(lastLocation.lat, lastLocation.lon, temperatureUnit, windSpeedUnit, pressureUnit);
				
				// Fetch forecast with correct units
				const forecast = await getWeatherForecast(lastLocation.lat, lastLocation.lon, temperatureUnit, windSpeedUnit);
				
				// Update settings with weather data
				settingsStore.updateWeatherData(current, forecast);
				
			} catch (error) {
				settingsStore.setWeatherError(error.message);
			}
		} else {
			// No location stored, try to detect again
			await weatherActions.autoDetectAndFetch();
		}
	},

	/**
	 * Clear weather data
	 */
	clear() {
		settingsStore.updateSettings({
			'weather.currentWeather': null,
			'weather.forecast': [],
			'weather.lastLocation': null,
			'weather.lastUpdated': null,
			'weather.error': null
		});
	},

	/**
	 * Enable location services and fetch weather
	 */
	async enableLocationServices() {
		settingsStore.toggleLocationServices();
		
		// Clear any existing errors first
		settingsStore.clearWeatherError();
		
		// Check if location permissions are now available
		if (navigator.permissions && navigator.permissions.query) {
			try {
				const permission = await navigator.permissions.query({ name: 'geolocation' });
				if (permission.state === 'granted') {
					console.log('Location permission granted, proceeding with weather detection...');
					await weatherActions.autoDetectAndFetch();
				} else if (permission.state === 'prompt') {
					console.log('Location permission prompt, requesting location...');
					await weatherActions.autoDetectAndFetch();
				} else {
					console.log('Location permission denied, showing error...');
					settingsStore.setWeatherError('Location permission denied. Please enable location access in your browser settings.');
				}
			} catch (error) {
				console.log('Permission API not supported, proceeding with location request...');
				await weatherActions.autoDetectAndFetch();
			}
		} else {
			// Fallback for browsers without permissions API
			console.log('Permissions API not available, proceeding with location request...');
			await weatherActions.autoDetectAndFetch();
		}
	},

	/**
	 * Disable location services
	 */
	disableLocationServices() {
		settingsStore.toggleLocationServices();
		settingsStore.clearWeatherError();
	},

	/**
	 * Change temperature unit and refresh data if needed
	 */
	async changeTemperatureUnit(unit) {
		const success = settingsStore.setTemperatureUnit(unit);
		if (success && settingsStore.getCurrentWeather()) {
			// Refresh data to get new units
			await weatherActions.refresh();
		}
		return success;
	},

	/**
	 * Change wind speed unit and refresh data if needed
	 */
	async changeWindSpeedUnit(unit) {
		const success = settingsStore.setWindSpeedUnit(unit);
		if (success && settingsStore.getCurrentWeather()) {
			// Refresh data to get new units
			await weatherActions.refresh();
		}
		return success;
	},

	/**
	 * Change pressure unit and refresh data if needed
	 */
	async changePressureUnit(unit) {
		const success = settingsStore.setPressureUnit(unit);
		if (success && settingsStore.getCurrentWeather()) {
			// Refresh data to get new units
			await weatherActions.refresh();
		}
		return success;
	},

	/**
	 * Set auto-refresh interval
	 */
	setRefreshInterval(minutes) {
		if (minutes >= 1 && minutes <= 60) {
			settingsStore.set('weather.refreshInterval', minutes);
			return true;
		}
		return false;
	},

	/**
	 * Toggle auto-refresh
	 */
	toggleAutoRefresh() {
		const current = settingsStore.isWeatherAutoRefreshEnabled();
		settingsStore.set('weather.autoRefresh', !current);
		return !current;
	},

	/**
	 * Update only the location name without fetching new weather data
	 */
	async updateLocationOnly() {
		const lastLocation = settingsStore.getLastLocation();
		if (lastLocation) {
			try {
				console.log('Updating location name only...');
				
				// Get city name from coordinates
				const { getCityName } = await import('./weather-utils.js');
				const cityInfo = await getCityName(lastLocation.lat, lastLocation.lon);
				
				// Update the current weather with new city info
				const currentWeather = settingsStore.getCurrentWeather();
				if (currentWeather) {
					const updatedWeather = {
						...currentWeather,
						city: cityInfo.city,
						country: cityInfo.country
					};
					
					settingsStore.updateSettings({
						'weather.currentWeather': updatedWeather
					});
					
					console.log('Location updated:', cityInfo);
				}
			} catch (error) {
				console.error('Failed to update location:', error);
			}
		}
	}
};
