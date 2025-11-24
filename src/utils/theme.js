import { settingsStore } from '../store/settings';
import { derived } from 'svelte/store';

/**
 * Reactive store for accent color - automatically updates when settings change
 */
export const accentColorStore = derived(
	settingsStore,
	($settings) => $settings.settings?.appearance?.accentColor || '#ff00ff'
);

/**
 * Reactive store for background theme - automatically updates when settings change
 */
export const backgroundThemeStore = derived(
	settingsStore,
	($settings) => $settings.settings?.appearance?.background || 'dark'
);

/**
 * Reactive store for background class - automatically updates when theme changes
 */
export const backgroundClassStore = derived(
	backgroundThemeStore,
	($theme) => $theme === 'light' ? 'bg-white' : 'bg-black'
);

/**
 * Reactive store for text color class - automatically updates when theme changes
 */
export const textColorClassStore = derived(
	backgroundThemeStore,
	($theme) => $theme === 'light' ? 'text-black' : 'text-white'
);

/**
 * Reactive store for border color class - automatically updates when theme changes
 */
export const borderColorClassStore = derived(
	backgroundThemeStore,
	($theme) => $theme === 'light' ? 'border-black' : 'border-white'
);

/**
 * Get the current accent color from settings (non-reactive, for use in non-Svelte contexts)
 * @returns {string} Hex color code (default: '#ff00ff')
 */
export function getAccentColor() {
	return settingsStore.get('appearance.accentColor') || '#ff00ff';
}

/**
 * Get the current background theme from settings (non-reactive, for use in non-Svelte contexts)
 * @returns {string} 'light' or 'dark' (default: 'dark')
 */
export function getBackgroundTheme() {
	return settingsStore.get('appearance.background') || 'dark';
}

/**
 * Get the background color class based on theme (non-reactive, for use in non-Svelte contexts)
 * @returns {string} 'bg-white' for light mode, 'bg-black' for dark mode
 */
export function getBackgroundClass() {
	const theme = getBackgroundTheme();
	return theme === 'light' ? 'bg-white' : 'bg-black';
}

/**
 * Get the text color class based on theme (non-reactive, for use in non-Svelte contexts)
 * @returns {string} 'text-black' for light mode, 'text-white' for dark mode
 */
export function getTextColorClass() {
	const theme = getBackgroundTheme();
	return theme === 'light' ? 'text-black' : 'text-white';
}

