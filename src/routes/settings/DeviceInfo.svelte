<script>
	import { onMount } from 'svelte';
	import { accentColorStore, backgroundThemeStore } from '../../utils/theme';

	export let isExiting = false;

	$: accentColor = $accentColorStore;
	$: backgroundTheme = $backgroundThemeStore;

	let deviceInfo = {};

	// Format key names for display
	function formatKey(key) {
		return key
			.replace(/([A-Z])/g, ' $1')
			.replace(/^./, (str) => str.toUpperCase())
			.trim();
	}

	// Get device information from navigator
	function getDeviceInfo() {
		if (typeof window === 'undefined' || !navigator) return {};

		const info = {
			userAgent: navigator.userAgent || 'Unknown',
			platform: navigator.platform || 'Unknown',
			language: navigator.language || 'Unknown',
			languages: navigator.languages ? navigator.languages.join(', ') : 'Unknown',
			cookieEnabled: navigator.cookieEnabled ? 'Yes' : 'No',
			onLine: navigator.onLine ? 'Yes' : 'No',
			hardwareConcurrency: navigator.hardwareConcurrency || 'Unknown',
			maxTouchPoints: navigator.maxTouchPoints !== undefined ? navigator.maxTouchPoints : 'Unknown',
			vendor: navigator.vendor || 'Unknown',
			appName: navigator.appName || 'Unknown',
			appVersion: navigator.appVersion || 'Unknown',
			screenWidth: window.screen ? window.screen.width : 'Unknown',
			screenHeight: window.screen ? window.screen.height : 'Unknown',
			screenColorDepth: window.screen ? window.screen.colorDepth : 'Unknown',
			screenPixelDepth: window.screen ? window.screen.pixelDepth : 'Unknown',
			windowWidth: window.innerWidth || 'Unknown',
			windowHeight: window.innerHeight || 'Unknown',
			devicePixelRatio: window.devicePixelRatio || 'Unknown',
			timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Unknown',
			timezoneOffset: new Date().getTimezoneOffset() || 'Unknown'
		};

		// Try to get memory info (Chrome only)
		if ('memory' in performance) {
			info.jsHeapSizeLimit = performance.memory.jsHeapSizeLimit
				? (performance.memory.jsHeapSizeLimit / (1024 * 1024)).toFixed(2) + ' MB'
				: 'Unknown';
			info.totalJSHeapSize = performance.memory.totalJSHeapSize
				? (performance.memory.totalJSHeapSize / (1024 * 1024)).toFixed(2) + ' MB'
				: 'Unknown';
			info.usedJSHeapSize = performance.memory.usedJSHeapSize
				? (performance.memory.usedJSHeapSize / (1024 * 1024)).toFixed(2) + ' MB'
				: 'Unknown';
		}

		// Try to get connection info (if available)
		if ('connection' in navigator) {
			const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
			if (conn) {
				info.effectiveType = conn.effectiveType || 'Unknown';
				info.downlink = conn.downlink ? conn.downlink + ' Mbps' : 'Unknown';
				info.rtt = conn.rtt ? conn.rtt + ' ms' : 'Unknown';
				info.saveData = conn.saveData ? 'Yes' : 'No';
			}
		}

		// Try to get battery info (if available)
		if ('getBattery' in navigator) {
			navigator.getBattery().then((battery) => {
				deviceInfo = {
					...deviceInfo,
					batteryLevel: (battery.level * 100).toFixed(0) + '%',
					batteryCharging: battery.charging ? 'Yes' : 'No',
					batteryChargingTime: battery.chargingTime !== Infinity
						? Math.round(battery.chargingTime / 60) + ' minutes'
						: 'Not charging',
					batteryDischargingTime: battery.dischargingTime !== Infinity
						? Math.round(battery.dischargingTime / 60) + ' minutes'
						: 'Unknown'
				};
			});
		}

		return info;
	}

	onMount(() => {
		deviceInfo = getDeviceInfo();
	});
</script>

<div class="page-holder">
	<div class="page pt-4 px-4 flex flex-col h-screen" class:page-exit={isExiting}>
		<span class="text-6xl font-[300]">device information</span>
		<div class="flex flex-col gap-6 mt-8 flex-1 overflow-y-auto pb-16">
			<div class="flex flex-col gap-4">
				{#each Object.entries(deviceInfo) as [key, value]}
					<div class="flex flex-col gap-1">
						<span class="text-sm font-[300] text-[#767676]">{formatKey(key)}</span>
						<span class="text-base font-[300] break-words">{String(value)}</span>
					</div>
				{/each}
			</div>
		</div>
	</div>
</div>

<style>
	.page {
		height: 100%;
		width: 100%;
	}
</style>

