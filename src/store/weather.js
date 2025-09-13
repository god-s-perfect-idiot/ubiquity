import { writable } from 'svelte/store';

// Weather store - only holds data in memory, no localStorage persistence
function createWeatherStore() {
  const { subscribe, set, update } = writable({
    currentWeather: null,
    forecast: [],
    lastLocation: null,
    lastUpdated: null,
    error: null,
    loading: false
  });

  return {
    subscribe,
    
    // Set weather data
    setWeatherData(currentWeather, forecast) {
      update(state => ({
        ...state,
        currentWeather,
        forecast,
        lastUpdated: new Date().toISOString(),
        error: null,
        loading: false
      }));
    },

    // Set location
    setLocation(location) {
      update(state => ({
        ...state,
        lastLocation: location
      }));
    },

    // Set error
    setError(error) {
      update(state => ({
        ...state,
        error,
        loading: false
      }));
    },

    // Clear error
    clearError() {
      update(state => ({
        ...state,
        error: null
      }));
    },

    // Set loading state
    setLoading(loading) {
      update(state => ({
        ...state,
        loading
      }));
    },

    // Clear all weather data
    clear() {
      set({
        currentWeather: null,
        forecast: [],
        lastLocation: null,
        lastUpdated: null,
        error: null,
        loading: false
      });
    },

    // Get current state (for non-reactive access)
    getCurrentState() {
      let currentState;
      subscribe(state => currentState = state)();
      return currentState;
    }
  };
}

export const weatherStore = createWeatherStore();
