# PWA Setup for Ubiquity

This document explains the Progressive Web App (PWA) features implemented in Ubiquity.

## Features Implemented

### 1. Web App Manifest (`/static/manifest.json`)
- App name, description, and theme colors
- Icons for different sizes (192x192, 512x512)
- Display mode set to "standalone" for app-like experience
- Proper orientation and scope settings

### 2. Service Worker (`/static/sw.js`)
- Caches static assets for offline functionality
- Implements cache-first strategy for better performance
- Handles dynamic content caching
- Provides offline fallback page

### 3. PWA Install Button (`/src/components/PWAInstallButton.svelte`)
- Custom install prompt for better user experience
- Responsive design with smooth animations
- Handles install state management
- Dismissible banner

### 4. Offline Page (`/src/routes/offline/+page.svelte`)
- Custom offline experience
- Shows available offline features
- Network status indicator
- Retry functionality

### 5. PWA Utilities (`/src/lib/pwa.js`)
- Service worker registration
- Install prompt handling
- App installation detection
- Event management

## How to Test

1. **Build the app:**
   ```bash
   npm run build
   ```

2. **Serve the built app:**
   ```bash
   npm run preview
   ```

3. **Test PWA features:**
   - Open Chrome DevTools
   - Go to Application tab
   - Check Manifest and Service Workers sections
   - Test offline functionality by going offline in DevTools

4. **Test installation:**
   - Look for the install button in supported browsers
   - Or use the browser's install prompt (usually in the address bar)

## Browser Support

- Chrome/Edge: Full PWA support
- Firefox: Basic PWA support
- Safari: Limited PWA support (iOS 11.3+)
- Mobile browsers: Generally good support

## Customization

### Icons
To update the app icons:
1. Replace `/static/favicon.png` with your icon
2. Use the `/static/generate-icons.html` tool to generate required sizes
3. Update the manifest.json with new icon paths

### Theme Colors
Update the theme colors in:
- `/static/manifest.json` (theme_color, background_color)
- `/src/app.html` (meta theme-color)
- `/src/components/PWAInstallButton.svelte` (button colors)

### Caching Strategy
Modify `/static/sw.js` to adjust:
- Which files to cache
- Cache expiration policies
- Offline fallback behavior

## Troubleshooting

### Service Worker Not Registering
- Check browser console for errors
- Ensure the app is served over HTTPS (required for PWA)
- Clear browser cache and try again

### Install Button Not Showing
- Check if the app meets PWA criteria
- Ensure manifest.json is valid
- Test in different browsers

### Offline Functionality Issues
- Check service worker cache in DevTools
- Verify URLs in urlsToCache array
- Test network throttling in DevTools

## Next Steps

1. Add more comprehensive caching for API calls
2. Implement push notifications
3. Add app shortcuts in manifest
4. Create splash screens for different devices
5. Add background sync for offline actions
