import { writable } from 'svelte/store';

// System settings store structure
const createSettingsStore = () => {
  const { subscribe, set, update } = writable({
    settings: {
      // Appearance settings
      appearance: {
        theme: 'system', // 'light', 'dark', 'system'
        background: 'dark', // 'light' or 'dark'
        fontSize: 'medium', // 'small', 'medium', 'large'
        fontFamily: 'system', // 'system', 'monospace', 'serif'
        accentColor: '#ff00ff', // Primary accent color (Fuschia default)
        borderRadius: 'medium', // 'none', 'small', 'medium', 'large'
        animations: true, // Enable/disable animations
        compactMode: false, // Compact UI mode
        showMoreCols: false // Show 6 columns instead of 4 in start menu (false = 4 cols, true = 6 cols)
      },
      
      // System settings
      system: {
        language: 'en', // Language code
        region: 'US', // Region code
        timezone: 'auto', // Timezone or 'auto' for system
        dateFormat: 'MM/DD/YYYY', // Date format
        timeFormat: '12h', // '12h' or '24h'
        firstDayOfWeek: 'monday', // 'sunday' or 'monday'
        temperatureUnit: 'fahrenheit', // 'celsius' or 'fahrenheit'
        distanceUnit: 'imperial', // 'metric' or 'imperial'
        weightUnit: 'pounds' // 'kilograms' or 'pounds'
      },
      
      // Privacy settings
      privacy: {
        analytics: true, // Enable analytics
        telemetry: false, // Enable telemetry
        crashReports: true, // Enable crash reports
        usageData: false, // Enable usage data collection
        locationServices: false, // Enable location services
        notifications: true // Enable notifications
      },
      
      // Performance settings
      performance: {
        hardwareAcceleration: true, // Enable hardware acceleration
        backgroundProcesses: true, // Allow background processes
        memoryOptimization: true, // Enable memory optimization
        cacheSize: 'auto', // Cache size or 'auto'
        updateFrequency: 'daily' // 'hourly', 'daily', 'weekly'
      },
      
      // Security settings
      security: {
        autoLock: true, // Auto-lock after inactivity
        lockTimeout: 300, // Lock timeout in seconds
        requirePassword: false, // Require password for changes
        twoFactorAuth: false, // Enable two-factor authentication
        encryption: true, // Enable data encryption
        backupEncryption: true // Encrypt backups
      },
      
      // Accessibility settings
      accessibility: {
        highContrast: false, // High contrast mode
        screenReader: false, // Screen reader support
        keyboardNavigation: true, // Enhanced keyboard navigation
        focusIndicators: true, // Visible focus indicators
        motionReduction: false, // Reduce motion
        colorBlindness: 'none' // 'none', 'protanopia', 'deuteranopia', 'tritanopia'
      },
      
      // Weather settings (only preferences, no data persistence)
      weather: {
        locationServices: false, // Enable location services for weather
        region: 'Metric', // 'Imperial' or 'Metric' - determines unit system
        temperatureUnit: 'celsius', // 'celsius' or 'fahrenheit'
        windSpeedUnit: 'kmh', // 'kmh', 'mph', or 'ms'
        pressureUnit: 'hpa', // 'hpa' or 'inHg'
        autoRefresh: true, // Auto-refresh weather data
        refreshInterval: 10 // Refresh interval in minutes
      },

      // Search settings
      search: {
        defaultEngine: 'DUCKDUCKGO', // Default search engine
        maxResults: 10, // Maximum number of results per search
        safeSearch: true, // Enable safe search filtering
        autoComplete: true, // Enable auto-complete suggestions
      }
    }
  });

  // Helper functions for settings management
  const settings = {
    // Get a specific setting value
    get(path) {
      let currentState;
      subscribe(state => currentState = state)();
      
      const keys = path.split('.');
      let value = currentState.settings;
      
      for (const key of keys) {
        if (value && typeof value === 'object' && key in value) {
          value = value[key];
        } else {
          return undefined;
        }
      }
      
      return value;
    },

    // Set a specific setting value
    set(path, value) {
      update(state => {
        const keys = path.split('.');
        let current = state.settings;
        
        // Navigate to the parent object
        for (let i = 0; i < keys.length - 1; i++) {
          if (!current[keys[i]] || typeof current[keys[i]] !== 'object') {
            current[keys[i]] = {};
          }
          current = current[keys[i]];
        }
        
        // Set the value
        current[keys[keys.length - 1]] = value;
        
        return state;
      });
      
      // Save to localStorage
      this.saveToStorage();
    },

    // Update multiple settings at once
    updateSettings(updates) {
      update(state => {
        const newSettings = { ...state.settings };
        
        for (const [path, value] of Object.entries(updates)) {
          const keys = path.split('.');
          let current = newSettings;
          
          // Navigate to the parent object
          for (let i = 0; i < keys.length - 1; i++) {
            if (!current[keys[i]] || typeof current[keys[i]] !== 'object') {
              current[keys[i]] = {};
            }
            current = current[keys[i]];
          }
          
          // Set the value
          current[keys[keys.length - 1]] = value;
        }
        
        return { ...state, settings: newSettings };
      });
      
      // Save to localStorage
      this.saveToStorage();
    },

    // Reset a specific setting to default
    reset(path) {
      const defaults = this.getDefaults();
      const keys = path.split('.');
      let defaultValue = defaults;
      
      for (const key of keys) {
        if (defaultValue && typeof defaultValue === 'object' && key in defaultValue) {
          defaultValue = defaultValue[key];
        } else {
          return false;
        }
      }
      
      this.set(path, defaultValue);
      return true;
    },

    // Reset all settings to defaults
    resetAll() {
      const defaults = this.getDefaults();
      set({ settings: defaults });
      this.saveToStorage();
    },

    // Get all settings
    getAll() {
      let currentState;
      subscribe(state => currentState = state)();
      return currentState.settings;
    },

    // Get settings for a specific category
    getCategory(category) {
      let currentState;
      subscribe(state => currentState = state)();
      return currentState.settings[category] || null;
    },

    // Check if a setting exists
    has(path) {
      return this.get(path) !== undefined;
    },

    // Get default settings
    getDefaults() {
      return {
        appearance: {
          theme: 'system',
          background: 'dark',
          fontSize: 'medium',
          fontFamily: 'system',
          accentColor: '#ff00ff',
          borderRadius: 'medium',
          animations: true,
          compactMode: false,
          showMoreCols: false
        },
        system: {
          language: 'en',
          region: 'US',
          timezone: 'auto',
          dateFormat: 'MM/DD/YYYY',
          timeFormat: '12h',
          firstDayOfWeek: 'monday',
          temperatureUnit: 'fahrenheit',
          distanceUnit: 'imperial',
          weightUnit: 'pounds'
        },
        privacy: {
          analytics: true,
          telemetry: false,
          crashReports: true,
          usageData: false,
          locationServices: false,
          notifications: true
        },
        performance: {
          hardwareAcceleration: true,
          backgroundProcesses: true,
          memoryOptimization: true,
          cacheSize: 'auto',
          updateFrequency: 'daily'
        },
        security: {
          autoLock: true,
          lockTimeout: 300,
          requirePassword: false,
          twoFactorAuth: false,
          encryption: true,
          backupEncryption: true
        },
        accessibility: {
          highContrast: false,
          screenReader: false,
          keyboardNavigation: true,
          focusIndicators: true,
          motionReduction: false,
          colorBlindness: 'none'
        },
        weather: {
          locationServices: false,
          region: 'Metric',
          temperatureUnit: 'celsius',
          windSpeedUnit: 'kmh',
          pressureUnit: 'hpa',
          autoRefresh: true,
          refreshInterval: 10
        },
        search: {
          defaultEngine: 'DUCKDUCKGO',
          maxResults: 10,
          safeSearch: true,
        }
      };
    },

    // Initialize settings from localStorage
    initFromStorage() {
      if (typeof window === 'undefined') return;
      
      try {
        const storedSettings = localStorage.getItem('system_settings');
        if (storedSettings) {
          const parsed = JSON.parse(storedSettings);
          
          // Use stored settings directly, only merge missing categories
          const defaults = this.getDefaults();
          const mergedSettings = { ...defaults };
          
          // Only add stored categories that exist, don't merge individual properties
          for (const [category, categorySettings] of Object.entries(parsed)) {
            if (defaults[category] && typeof categorySettings === 'object') {
              mergedSettings[category] = categorySettings; // Use stored values directly
            }
          }
          
          set({ settings: mergedSettings });
        } else {
          // No stored settings, ensure defaults are set
          const defaults = this.getDefaults();
          set({ settings: defaults });
        }
      } catch (error) {
        console.error('Error initializing settings from storage:', error);
        // If there's an error, reset to defaults
        this.resetAll();
      }
    },

    // Refresh settings from localStorage (useful when settings might have changed)
    refreshFromStorage() {
      this.initFromStorage();
    },

    // Save settings to localStorage
    saveToStorage() {
      if (typeof window === 'undefined') return;
      
      try {
        let currentState;
        subscribe(state => currentState = state)();
        const settingsToSave = currentState.settings;
        localStorage.setItem('system_settings', JSON.stringify(settingsToSave));
      } catch (error) {
        console.error('Error saving settings to storage:', error);
      }
    },

    // Merge stored settings with defaults
    mergeWithDefaults(stored, defaults) {
      const merged = { ...defaults };
      
      for (const [category, categorySettings] of Object.entries(stored)) {
        if (defaults[category] && typeof categorySettings === 'object') {
          if (category === 'search') {
            console.log(`DETAILED MERGING ${category}:`, {
              defaults: defaults[category],
              stored: categorySettings,
              'stored.safeSearch': categorySettings.safeSearch,
              'defaults.safeSearch': defaults[category].safeSearch,
              merged: { ...defaults[category], ...categorySettings },
              'merged.safeSearch': { ...defaults[category], ...categorySettings }.safeSearch
            });
          }
          // Prioritize stored values over defaults
          merged[category] = { ...defaults[category], ...categorySettings };
        }
      }
      
      console.log('Final merged settings:', merged);
      return merged;
    },

    // Export settings to JSON
    export() {
      let currentState;
      subscribe(state => currentState = state)();
      return JSON.stringify(currentState.settings, null, 2);
    },

    // Import settings from JSON
    import(jsonString) {
      try {
        const imported = JSON.parse(jsonString);
        const defaults = this.getDefaults();
        const mergedSettings = this.mergeWithDefaults(imported, defaults);
        
        set({ settings: mergedSettings });
        this.saveToStorage();
        return true;
      } catch (error) {
        console.error('Error importing settings:', error);
        return false;
      }
    },

    // Validate settings structure
    validate(settings) {
      const defaults = this.getDefaults();
      
      for (const [category, categoryDefaults] of Object.entries(defaults)) {
        if (!settings[category] || typeof settings[category] !== 'object') {
          return false;
        }
        
        for (const [key, defaultValue] of Object.entries(categoryDefaults)) {
          if (!(key in settings[category])) {
            return false;
          }
          
          // Type validation
          if (typeof settings[category][key] !== typeof defaultValue) {
            return false;
          }
        }
      }
      
      return true;
    },

    // Weather-specific methods (only for preferences, not data)
    // Check if weather auto-refresh is enabled
    isWeatherAutoRefreshEnabled() {
      return this.get('weather.autoRefresh');
    },

    // Get weather refresh interval
    getWeatherRefreshInterval() {
      return this.get('weather.refreshInterval');
    },

    // Toggle location services
    toggleLocationServices() {
      const current = this.get('weather.locationServices');
      this.set('weather.locationServices', !current);
      return !current;
    },

    // Change temperature unit
    setTemperatureUnit(unit) {
      if (['celsius', 'fahrenheit'].includes(unit)) {
        this.set('weather.temperatureUnit', unit);
        return true;
      }
      return false;
    },

    // Change wind speed unit
    setWindSpeedUnit(unit) {
      if (['kmh', 'mph', 'ms'].includes(unit)) {
        this.set('weather.windSpeedUnit', unit);
        return true;
      }
      return false;
    },

    // Change pressure unit
    setPressureUnit(unit) {
      if (['hpa', 'inHg'].includes(unit)) {
        this.set('weather.pressureUnit', unit);
        return true;
      }
      return false;
    },

    // Set region and update all weather units accordingly
    setRegion(region) {
      if (['Imperial', 'Metric'].includes(region)) {
        this.set('weather.region', region);
        
        // Update units based on region
        if (region === 'Imperial') {
          this.set('weather.temperatureUnit', 'fahrenheit');
          this.set('weather.windSpeedUnit', 'mph');
          this.set('weather.pressureUnit', 'inHg');
        } else {
          this.set('weather.temperatureUnit', 'celsius');
          this.set('weather.windSpeedUnit', 'kmh');
          this.set('weather.pressureUnit', 'hpa');
        }
        
        return true;
      }
      return false;
    },

    // Get current region
    getRegion() {
      return this.get('weather.region');
    }
  };

  return {
    subscribe,
    ...settings
  };
};

// Create and export the settings store
export const settingsStore = createSettingsStore();

// Initialize from localStorage on store creation
if (typeof window !== 'undefined') {
  settingsStore.initFromStorage();
}
