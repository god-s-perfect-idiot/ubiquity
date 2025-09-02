# Weather Setup Guide

The weather app in Ubiquity automatically detects your location and displays current weather conditions along with a 5-day forecast.

## Features

- **Auto-location detection** using browser geolocation
- **Current weather** with temperature, humidity, wind, and pressure
- **5-day forecast** with daily averages
- **Real-time updates** every 10 minutes
- **Responsive design** that works on all devices

## Setup Instructions

### 1. No API Key Required! 🎉

The weather app now uses the **Open-Meteo API**, which is completely free and doesn't require any registration or API keys.

### 2. Ready to Use

Simply start your development server and the weather app will work immediately:

```bash
npm run dev
# or
pnpm dev
```

### 3. Features

- **100% Free** - No API limits or costs
- **No Registration** - Works out of the box
- **High Accuracy** - Uses multiple weather models
- **Global Coverage** - Works anywhere in the world

## How It Works

1. **Location Detection**: When you first visit the weather page, your browser will request permission to access your location
2. **Weather Fetching**: Once location is granted, the app fetches current weather and forecast data
3. **Auto-refresh**: Weather data automatically refreshes every 10 minutes
4. **Manual Refresh**: You can manually refresh by clicking the refresh button

## Browser Permissions

The weather app requires location access. When prompted:

- **Allow**: Grants access to your current location for weather data
- **Block**: Prevents the app from detecting your location

You can change this permission later in your browser settings.

## Troubleshooting

### "Geolocation error" Message
- Check if your browser supports geolocation
- Ensure location permissions are enabled
- Try refreshing the page

### No Weather Data Displayed
- Check your internet connection
- Verify you have location permissions
- Check browser console for error messages

### API Errors
- The Open-Meteo API is very reliable, but if you encounter issues:
- Check your internet connection
- Try refreshing the page
- The service automatically retries failed requests

## API Limits

The Open-Meteo API is completely free with generous limits:
- **No daily limits** - Unlimited API calls
- **No rate limiting** - Use as much as you need
- **High accuracy** - Multiple weather models
- **Global coverage** - Works worldwide
- **No registration** - Zero setup required

Perfect for personal use, development, and production applications.

## Customization

You can customize the weather display by modifying:
- `src/components/WeatherDisplay.svelte` - Current weather layout
- `src/components/WeatherForecast.svelte` - Forecast display
- `src/lib/weather-utils.js` - Weather data processing
- `src/lib/weather-actions.js` - Weather actions and settings integration
- `src/store/settings.js` - Weather settings and state management

## Settings Integration

Weather settings are now integrated into the main settings store under the `weather` category:

- **Location Services**: Enable/disable automatic location detection
- **Temperature Unit**: Switch between Celsius and Fahrenheit
- **Wind Speed Unit**: Choose between km/h, mph, or m/s
- **Pressure Unit**: Select hPa or inHg
- **Auto-refresh**: Enable/disable automatic weather updates
- **Refresh Interval**: Set custom update frequency (1-60 minutes)

## Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify your API key is working
3. Ensure location permissions are granted
4. Check your internet connection
