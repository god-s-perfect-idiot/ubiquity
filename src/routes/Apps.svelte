<!-- This is the ugliest code I've written. -->
<script>
	import { onMount, tick } from 'svelte';
	import { fetchApps } from '../kernel/system-utils';
	import { kernel } from '../kernel/store';
	import AppMenu from '../components/AppMenu.svelte';
	import LetterGrid from '../components/LetterGrid.svelte';
	import { addToast } from '../store/toast';
	import { getFaviconUrls } from '../kernel/favicon-utils';
	import Icon from '@iconify/svelte';
	import { homescreenStore } from '../store/homescreen.js';
	import { gridStore } from '../store/grid.js';
	import { appInfoStore } from '../store/appInfo.js';
	import {
		accentColorStore,
		textColorClassStore,
		borderColorClassStore,
		backgroundThemeStore
	} from '../utils/theme';

	export let onBackClick = () => {};

	$: accentColor = $accentColorStore;
	$: textClass = $textColorClassStore;
	$: borderClass = $borderColorClassStore;
	$: backgroundTheme = $backgroundThemeStore;

	const systemApps = [
		{
			name: 'Ubiquity',
			content: '/about',
			isSystemApp: true,
			icon: 'mdi:information',
			bgColor: '' // Will use accent color via inline style
		},
		{
			name: 'Settings',
			content: '/settings',
			isSystemApp: true,
			icon: 'rivet-icons:settings',
			bgColor: 'bg-green-800'
		},
		{
			name: 'Files',
			content: '/files',
			isSystemApp: true,
			icon: 'material-symbols:files-sharp',
			bgColor: 'bg-blue-900'
		},
		{
			name: 'Photos',
			content: '/photos',
			isSystemApp: true,
			icon: 'tdesign:image-filled',
			bgColor: 'bg-orange-600'
		},
		{
			name: 'Camera',
			content: '/camera',
			isSystemApp: true,
			icon: 'el:camera',
			bgColor: 'bg-[#4b1a4b]'
		},
		{
			name: 'Music',
			content: '/music',
			isSystemApp: true,
			icon: 'ic:sharp-headphones',
			bgColor: 'bg-green-700'
		},
		{
			name: 'Video',
			content: '/video',
			isSystemApp: true,
			icon: 'tdesign:video-filled',
			bgColor: 'bg-pink-800'
		},
		{
			name: 'Clock',
			content: '/clock',
			isSystemApp: true,
			icon: 'nrk:clock',
			bgColor: 'bg-indigo-800'
		},
		{
			name: 'Documents',
			content: '/documents',
			isSystemApp: true,
			icon: 'ix:document-filled',
			bgColor: 'bg-red-700'
		},
		{
			name: 'Feedback',
			content: '/feedback',
			isSystemApp: true,
			icon: 'fluent-mdl2:feedback-response-solid',
			bgColor: 'bg-teal-700'
		},
		{
			name: 'Marketplace',
			content: '/marketplace',
			isSystemApp: true,
			icon: 'ic:sharp-store',
			bgColor: 'bg-purple-900'
		},
		{
			name: 'Spotify (Metro)',
			content: '/spotify',
			isSystemApp: true,
			icon: 'mdi:spotify',
			bgColor: 'bg-green-700'
		},
		{
			name: 'Weather',
			content: '/weather',
			isSystemApp: true,
			icon: 'material-symbols-light:weather-mix',
			bgColor: 'bg-blue-900'
		},
		{
			name: 'Search',
			content: '/search',
			isSystemApp: true,
			icon: 'mdi:magnify',
			bgColor: 'bg-red-700'
		},
		{
			name: 'Live Tiles Toolkit',
			content: '/live-tiles',
			isSystemApp: true,
			icon: 'material-symbols:grid-view',
			bgColor: 'bg-purple-800'
		}
	];
	let apps = [];
	let faviconCache = {};

	const appList = {};
	let showGrid = false;

	onMount(() => {
		const installedApps = fetchApps(kernel.fs.getFiles());
		apps = [...installedApps, ...systemApps];
		apps = apps.sort((a, b) => a.name.localeCompare(b.name));
		apps.forEach((app) => {
			const firstLetter = app.name.charAt(0).toUpperCase();
			if (appList[firstLetter]) {
				appList[firstLetter].push(app);
			} else {
				appList[firstLetter] = [app];
			}
		});

		// Get favicon URLs for external apps
		faviconCache = getFaviconUrls(installedApps);
	});

	async function scrollToChar(char) {
		await tick();
		const targetElement = document.getElementById(char);
		console.log(targetElement);
		if (targetElement) {
			targetElement.scrollIntoView({ behavior: 'instant' });
		}
	}

	function handleLetterClick(char) {
		targetChar = char;
		isExiting = true;
		setTimeout(
			() => {
				const targetId = char.toUpperCase();
				scrollToChar(targetId);
				showGrid = false;
				isExiting = false;
			},
			27 * 10 + 200 // 27 letters in the grid
		); // Wait for all animations to complete
		targetChar = '';
	}

	let pressTimer;
	let longPressThreshold = 500; // milliseconds
	let isExiting = false;
	let isEntering = false;
	let targetChar = '';
	let showMenu = null;
	let isLongPress = false;
	let isMenuActionInProgress = false; // Flag to prevent menu from reopening after action
	let launchingApp = null; // Track which app is being launched
	let animatingApps = new Set(); // Track which apps are currently animating
	let appEntryRefs = new Map(); // Store references to app entry elements

	function handleTouchStart(appName) {
		// Don't start long press if menu action is in progress
		if (isMenuActionInProgress) return;

		isLongPress = false;
		pressTimer = setTimeout(() => {
			// Double check flag before opening menu
			if (!isMenuActionInProgress) {
				isLongPress = true;
				handleLongPress(appName);
			}
		}, longPressThreshold);
	}

	function handleTouchEnd(event) {
		clearTimeout(pressTimer);
		if (isLongPress || showMenu !== null) {
			event.preventDefault();
		}
		isLongPress = false;
	}

	function handleLongPress(appName) {
		// Don't open menu if action is in progress
		if (isMenuActionInProgress) return;
		showMenu = appName;
	}

	function handleOutsideTouch(event) {
		// This is so ugly, I'm sorry if this repo ever gets popular
		// if (event.target.classList.contains('override-touch-controls')) {
		// 	return;
		// }
		// Check if the click happened inside the app-menu or any of its children
		const appMenu = event.target.closest('.app-menu');
		if (!appMenu) {
			if (showMenu !== null) {
				showMenu = null; // Unset showMenu immediately
				isExiting = true;
				setTimeout(() => {
					isExiting = false;
				}, 500); // Match this to the animation duration
				event.preventDefault();
			}
		}
	}

	function handleRemoveApp(appName) {
		// Set flag to prevent menu from reopening
		isMenuActionInProgress = true;

		// Clear any pending long press timers
		if (pressTimer) {
			clearTimeout(pressTimer);
			pressTimer = null;
		}

		// Find the app to get its URL
		const app = apps.find((a) => a.name === appName);

		kernel.removeFile(appName, 'app');
		appList[appName.charAt(0).toUpperCase()] = appList[appName.charAt(0).toUpperCase()].filter(
			(app) => app.name !== appName
		);
		if (appList[appName.charAt(0).toUpperCase()].length === 0) {
			delete appList[appName.charAt(0).toUpperCase()];
		}

		// Remove from favicon cache
		if (faviconCache[appName]) {
			delete faviconCache[appName];
		}

		// Remove from appInfo store
		appInfoStore.removeAppInfo(appName);
		if (app?.content) {
			appInfoStore.removeAppInfo(app.content);
		}
		if (app?.url) {
			appInfoStore.removeAppInfo(app.url);
		}

		showMenu = null;
		isExiting = true;
		isLongPress = false; // Reset long press state

		setTimeout(() => {
			isExiting = false;
			// Reset flag after a delay to prevent immediate reopening
			setTimeout(() => {
				isMenuActionInProgress = false;
			}, 300);
		}, 500);
		addToast(`${appName} removed`, 2000);
	}

	// Helper function to extract color value from bgColor (Tailwind class or hex)
	function extractColorValue(bgColor) {
		if (!bgColor) return null;

		// If it's a Tailwind arbitrary value like bg-[#ff00ff], extract the hex
		const arbitraryMatch = bgColor.match(/bg-\[#([0-9a-fA-F]{6})\]/);
		if (arbitraryMatch) {
			return `#${arbitraryMatch[1]}`;
		}

		// If it's already a hex color (starts with #)
		if (bgColor.startsWith('#')) {
			return bgColor;
		}

		// If it's a Tailwind class, we'll need to map it or return null
		// For now, return null and let it fall back to default
		return null;
	}

	// Helper function to check if color is black (or very close)
	function isBlack(color) {
		if (!color) return false;

		// Remove # if present
		const hex = color.replace('#', '');
		if (hex.length !== 6) return false;

		const r = parseInt(hex.substr(0, 2), 16);
		const g = parseInt(hex.substr(2, 2), 16);
		const b = parseInt(hex.substr(4, 2), 16);

		// Check if it's black (all values close to 0)
		const isBlack = r < 15 && g < 15 && b < 15;

		return isBlack;
	}

	// Helper function to check if color is white (or very close)
	function isWhite(color) {
		if (!color) return false;

		// Remove # if present
		const hex = color.replace('#', '');
		if (hex.length !== 6) return false;

		const r = parseInt(hex.substr(0, 2), 16);
		const g = parseInt(hex.substr(2, 2), 16);
		const b = parseInt(hex.substr(4, 2), 16);

		// Check if it's white (all values > 240)
		return r > 240 && g > 240 && b > 240;
	}

	// Function to adjust bgColor based on theme
	function adjustBgColorForTheme(bgColor) {
		if (!bgColor) return bgColor;

		// Check if it's a hex color
		if (bgColor.startsWith('#')) {
			// In light mode: if background is white, use gray shade
			if (backgroundTheme === 'light' && isWhite(bgColor)) {
				return '#eeeeee'; // Light gray for visibility on white background
			}
			// In dark mode: if background is black, use a readable color
			if (backgroundTheme === 'dark' && isBlack(bgColor)) {
				return '#2a2a2a'; // Dark gray for visibility on black background
			}
			return bgColor;
		}

		// Check if it's a Tailwind class
		if (bgColor.includes('white') || bgColor === 'bg-white') {
			// In light mode, use gray instead of white
			return backgroundTheme === 'light' ? '#eeeeee' : '#ffffff';
		} else if (bgColor.includes('black') || bgColor === 'bg-black') {
			// In dark mode, use dark gray instead of black
			return backgroundTheme === 'dark' ? '#2a2a2a' : '#000000';
		}

		return bgColor;
	}

	async function handlePinToHomescreen(app) {
		// Set flag to prevent menu from reopening
		isMenuActionInProgress = true;

		// Clear any pending long press timers
		if (pressTimer) {
			clearTimeout(pressTimer);
			pressTimer = null;
		}

		// Pin to homescreen (allow multiple pins of the same app)
		// Get app info from appInfo store (Firebase data or starter data)
		// Try multiple keys: app name, content URL, and app URL
		const appInfo =
			appInfoStore.getAppInfo(app.name) ||
			appInfoStore.getAppInfo(app.content) ||
			appInfoStore.getAppInfo(app.url);

		// Fallback to favicon cache if no appInfo
		const faviconData = faviconCache[app.name];

		// Get icon src - check appInfo.icon (if URL), then favicon cache
		let iconSrc = null;
		if (
			appInfo?.icon &&
			(appInfo.icon.startsWith('http://') || appInfo.icon.startsWith('https://'))
		) {
			// icon is a URL (from Firebase/marketplace)
			iconSrc = appInfo.icon;
		} else if (faviconData?.url) {
			// Fallback to favicon cache
			iconSrc = faviconData.url;
		}

		// Get backgroundColor - prioritize appInfo, then app data, then favicon cache
		const backgroundColorClass =
			appInfo?.bgColor ||
			appInfo?.backgroundColor ||
			app.bgColor ||
			app.backgroundColor ||
			faviconData?.bgColor ||
			'';

		// Extract actual color value and check if it's not black
		const backgroundColorValue = extractColorValue(backgroundColorClass);
		let finalBgColor = backgroundColorClass; // Default to class

		// If we have a color value and it's not black, use it as the tile background
		if (backgroundColorValue && !isBlack(backgroundColorValue)) {
			finalBgColor = backgroundColorValue; // Use the hex color value
		}

		// Use iconify icon if no icon src exists (for iconify icons like 'mdi:application')
		// Prioritize appInfo.icon if it's an iconify icon (not a URL), then app.icon, then default
		let iconifyIcon = 'mdi:application';
		if (
			appInfo?.icon &&
			!appInfo.icon.startsWith('http://') &&
			!appInfo.icon.startsWith('https://')
		) {
			// appInfo.icon is an iconify icon (not a URL)
			iconifyIcon = appInfo.icon;
		} else if (app.icon && !app.icon.startsWith('http://') && !app.icon.startsWith('https://')) {
			// app.icon is an iconify icon (not a URL)
			iconifyIcon = app.icon;
		}

		// Only save minimal data - exclude bgColor and icon (these come from appInfo)
		const newItem = {
			id: `homescreen-${app.name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
			name: app.name,
			src: app.content,
			icon: iconifyIcon, // Iconify icon (fallback)
			size: '1x1'
		};

		// Close menu immediately and synchronously before any store updates
		showMenu = null;
		isExiting = true;
		isLongPress = false; // Reset long press state

		// Wait for DOM to update (menu to close) before updating stores
		await tick();

		// Now add items to stores
		homescreenStore.addItem(newItem);
		gridStore.addItem(newItem);
		addToast(`${app.name} pinned to homescreen`, 2000);

		// Wait a bit longer before allowing menu to open again
		setTimeout(() => {
			isExiting = false;
			// Reset flag after a delay to prevent immediate reopening
			setTimeout(() => {
				isMenuActionInProgress = false;
			}, 300);
		}, 500);
	}

	$: {
		if (showMenu !== null) {
			isEntering = true;
			setTimeout(() => {
				isEntering = false;
			}, 500); // Match this to the animation duration
		} else {
			// When menu closes, ensure entering state is reset
			isEntering = false;
		}
	}

	onMount(() => {
		window.oncontextmenu = () => {
			return false;
		};

		// Clean up any leftover animation classes when component mounts
		// This fixes the issue where returning from a webview leaves elements invisible
		function cleanupAnimations() {
			// Reset state
			launchingApp = null;
			animatingApps.clear();

			// Remove all pivot-out classes from app entries
			const allAppEntries = document.querySelectorAll('.app-entry-content');
			allAppEntries.forEach((element) => {
				element.classList.remove('pivot-out', 'app-launch');
			});

			// Remove pivot-out classes from letter headers
			const allLetterHeaders = document.querySelectorAll('.letter-header');
			allLetterHeaders.forEach((element) => {
				element.classList.remove('pivot-out');
			});

			// Remove pivot-out class from back button
			const backButton = document.querySelector('.back-button');
			if (backButton) {
				backButton.classList.remove('pivot-out');
			}
		}

		// Clean up immediately
		cleanupAnimations();

		// Also clean up after a short delay to catch any late animations
		setTimeout(cleanupAnimations, 500);

		// Clean up when page becomes visible again (handles returning from webview)
		const handleVisibilityChange = () => {
			if (!document.hidden) {
				// Page is visible again, clean up animations
				setTimeout(cleanupAnimations, 100);
			}
		};

		document.addEventListener('visibilitychange', handleVisibilityChange);

		// Cleanup on unmount
		return () => {
			document.removeEventListener('visibilitychange', handleVisibilityChange);
		};
	});

	// Function to get all app entries in order (from top to bottom)
	function getAllAppEntries() {
		const entries = [];
		const container = document.querySelector('.flex-1.overflow-y-auto');
		if (!container) return entries;

		// Get all app entry divs (the ones with class "flex flex-col relative")
		const allAppDivs = container.querySelectorAll('.app-entry');
		allAppDivs.forEach((div) => {
			const appName = div.dataset.appName;
			if (appName) {
				entries.push({ element: div, name: appName, type: 'app' });
			}
		});

		return entries;
	}

	// Function to get all letter headers in order (from top to bottom)
	function getAllLetterEntries() {
		const entries = [];
		const container = document.querySelector('.flex-1.overflow-y-auto');
		if (!container) return entries;

		// Get all letter header divs
		const allLetterDivs = container.querySelectorAll('.letter-header');
		allLetterDivs.forEach((div) => {
			const letter = div.dataset.letter;
			if (letter) {
				entries.push({ element: div, name: letter, type: 'letter' });
			}
		});

		return entries;
	}

	// Function to get all entries (both apps and letters) in order
	function getAllEntries() {
		const appEntries = getAllAppEntries();
		const letterEntries = getAllLetterEntries();

		// Combine and sort by position in DOM
		const container = document.querySelector('.flex-1.overflow-y-auto');
		if (!container) return appEntries;

		const allEntries = [...appEntries, ...letterEntries];

		// Sort by position in DOM (top to bottom)
		allEntries.sort((a, b) => {
			const rectA = a.element.getBoundingClientRect();
			const rectB = b.element.getBoundingClientRect();
			return rectA.top - rectB.top;
		});

		return allEntries;
	}

	// Function to check if an element is visible in viewport
	function isElementVisible(element, container) {
		const rect = element.getBoundingClientRect();
		const containerRect = container.getBoundingClientRect();

		return (
			rect.bottom >= containerRect.top &&
			rect.top <= containerRect.bottom &&
			rect.right >= containerRect.left &&
			rect.left <= containerRect.right
		);
	}

	// Function to handle app launch with animation
	async function handleAppLaunch(event, app) {
		// Prevent default navigation
		event.preventDefault();

		// Don't launch if menu is open or already launching
		if (showMenu !== null || launchingApp !== null) {
			return;
		}

		launchingApp = app.name;
		await tick();

		// Get all entries (both apps and letters)
		const allEntries = getAllEntries();
		const container = document.querySelector('.flex-1.overflow-y-auto');

		// Get the clicked app's letter
		const clickedAppLetter = app.name.charAt(0).toUpperCase();

		// Filter out the clicked app and get entries from bottom to top
		// For optimization, only include visible entries
		const entriesToAnimate = allEntries
			.filter((entry) => {
				// Exclude the clicked app
				if (entry.type === 'app' && entry.name === app.name) return false;
				// Only include if visible in viewport (for optimization)
				if (container) {
					return isElementVisible(entry.element, container);
				}
				return true; // If no container, include all
			})
			.reverse(); // Reverse to get from bottom to top

		// Get the back button element
		const backButton = document.querySelector('.back-button');

		// Animate each entry sequentially from bottom to top
		const animationDelay = 30; // 30ms delay between each animation

		// Animate all other entries first
		for (let i = 0; i < entriesToAnimate.length; i++) {
			const entry = entriesToAnimate[i];
			animatingApps.add(entry.name);

			setTimeout(() => {
				let element;
				if (entry.type === 'letter') {
					// For letter headers, animate the element itself
					element = entry.element;
				} else {
					// For apps, animate the content div
					element = entry.element.querySelector('.app-entry-content');
				}
				if (element) {
					element.classList.add('pivot-out');
				}
			}, i * animationDelay);
		}

		// Wait for all animations to complete
		// If no entries to animate, still wait a bit for smooth transition
		const totalAnimationTime = Math.max(70, (entriesToAnimate.length * animationDelay) - 30 ); // 400ms for the animation itself

		setTimeout(async () => {
			// Animate back button immediately before the tapped item
			if (backButton) {
				backButton.classList.add('pivot-out');
			}

			// Small delay before animating the clicked app
			await tick();
			setTimeout(async () => {
				// Now animate the clicked app with pivot-out animation
				const clickedEntry = allEntries.find(
					(entry) => entry.type === 'app' && entry.name === app.name
				);
				if (clickedEntry) {
					const clickedElement = clickedEntry.element.querySelector('.app-entry-content');
					if (clickedElement) {
						clickedElement.classList.add('pivot-out');
						await tick();
					}
				}

				// Wait for clicked app animation, then navigate
				setTimeout(() => {
					// Navigate to the app
					window.location.href = app.content;
				}, 150); // Wait for pivot-out animation (200ms)
			}, 30); // Small delay between back button and clicked app
		}, totalAnimationTime);
	}
</script>

{#if showGrid}
	<LetterGrid
		items={apps}
		itemNameKey="name"
		{showGrid}
		{isExiting}
		onLetterClick={handleLetterClick}
	/>
{:else}
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<div class="flex flex-row gap-2 w-full h-full">
		<button
			class="fixed left-0 flex flex-col border h-10 w-10 mt-5 ml-6 z-[10] justify-center items-center {borderClass} rounded-full !border-2 p-2 font-bold back-button"
			on:click={onBackClick}
		>
			<Icon icon="subway:left-arrow" width="18" height="18" strokeWidth="2" />
		</button>
		<div class="flex-1 overflow-y-auto pb-32 overflow-x-hidden app-list-container">
			<div
				class={`mt-4 flex gap-2 flex-col w-full
			${isEntering ? 'active-enter' : ''} 
			${showMenu !== null && !isEntering ? 'inactive' : ''} 
			${isExiting ? 'active-exit' : ''}`}
				on:touchstart={handleOutsideTouch}
				on:click={handleOutsideTouch}
			>
				{#each Object.entries(appList) as appEntry}
					<div class={`flex flex-col gap-2`}>
						<!-- Touch event handler for each app entry -->
						<div
							class="pl-24 w-full letter-header"
							id={appEntry[0].toUpperCase()}
							data-letter={appEntry[0].toUpperCase()}
							on:click={() => {
								showGrid = true;
							}}
						>
							<div
								class="text-3xl lowercase border-2 w-12 h-12 justify-start items-end flex pl-1 pb-1"
								style="color: {accentColor}; border-color: {accentColor};"
						>
							{appEntry[0]}
							</div>
						</div>
						{#each appEntry[1] as app}
							<div
								class="flex flex-col relative app-entry"
								data-app-name={app.name}
								on:touchstart={() => handleTouchStart(app.name)}
								on:touchend={handleTouchEnd}
								on:touchcancel={handleTouchEnd}
								on:touchMove={handleTouchEnd}
							>
								<div
									class={`w-full pl-24 flex flex-row gap-4 items-center app-entry-content ${showMenu === app.name ? 'active' : ''} ${animatingApps.has(app.name) ? 'animating' : ''} ${launchingApp === app.name ? 'launching' : ''}`}
									on:click={(event) => {
										if (showMenu !== null) {
											event.preventDefault();
										} else {
											handleAppLaunch(event, app);
										}
									}}
									role="button"
									tabindex="0"
									on:keydown={(event) => {
										if (event.key === 'Enter' || event.key === ' ') {
											event.preventDefault();
											if (showMenu === null) {
												handleAppLaunch(event, app);
											}
										}
									}}
								>
									{#if app.isSystemApp}
										{@const adjustedBgColor = adjustBgColorForTheme(app.bgColor || '')}
										<span
											class={`w-12 h-12 justify-center items-center flex text-white font-[300] ${adjustedBgColor && !adjustedBgColor.startsWith('#') ? adjustedBgColor : ''}`}
											style={!app.bgColor
												? `background-color: ${accentColor};`
												: adjustedBgColor && adjustedBgColor.startsWith('#')
													? `background-color: ${adjustedBgColor};`
													: ''}
										>
											<Icon icon={app.icon} width="32" height="32" class="text-white" />
										</span>
									{:else}
										{@const appInfo =
											appInfoStore.getAppInfo(app.name) ||
											appInfoStore.getAppInfo(app.content) ||
											appInfoStore.getAppInfo(app.url)}
										{@const iconSrc =
											appInfo?.icon &&
											(appInfo.icon.startsWith('http://') || appInfo.icon.startsWith('https://'))
												? appInfo.icon 
												: faviconCache[app.name]?.url}
										{@const rawBgColor =
											appInfo?.bgColor ||
											appInfo?.backgroundColor ||
											faviconCache[app.name]?.bgColor ||
											''}
										{@const bgColor = adjustBgColorForTheme(rawBgColor)}
										{#if iconSrc}
											<img
												src={iconSrc}
												alt={`${app.name} icon`}
												class={`w-12 h-12 object-contain p-1 ${bgColor && !bgColor.startsWith('#') ? bgColor : ''}`}
												style={bgColor && bgColor.startsWith('#')
													? `background-color: ${bgColor};`
													: ''}
												on:error={(e) => {
													// Fallback to letter if image fails to load
													e.target.style.display = 'none';
													e.target.nextElementSibling.style.display = 'flex';
												}}
											/>
											<span
												class="w-12 h-12 justify-center items-center flex {textClass} font-[300] hidden"
												style="background-color: {accentColor};"
												>{app.name.charAt(0).toUpperCase()}</span
											>
										{:else}
											<span
												class="w-12 h-12 justify-center items-center flex {textClass} font-[300]"
												style="background-color: {accentColor};"
												>{app.name.charAt(0).toUpperCase()}</span
											>
										{/if}
									{/if}
									<span>
										{app.name}
									</span>
								</div>
								{#if showMenu === app.name}
									<div class="app-menu relative z-[102]">
										<AppMenu
											isSystemApp={app.isSystemApp}
											onRemove={() => handleRemoveApp(app.name)}
											onPinToHomescreen={() => handlePinToHomescreen(app)}
										/>
									</div>
								{/if}
							</div>
						{/each}
					</div>
				{/each}
			</div>
		</div>
	</div>
{/if}

<style>
	.active-enter {
		animation: shrink 0.5s ease-in forwards;
	}
	.inactive {
		transform: scale(0.95);
	}
	.active-exit {
		animation: expand 0.5s ease-out forwards;
	}
	.app-menu,
	.active {
		transform: scale(1.05);
		z-index: 20;
		transition:
			transform 0.3s ease-out,
			z-index 0.3s ease-out;
	}

	/* Add transition for the default state to ensure smooth exit animation */
	.ml-24.flex.flex-row.gap-4.items-center {
		transition:
			transform 0.3s ease-out,
			z-index 0.3s ease-out;
	}

	/* Container with perspective for 3D effect */
	.app-list-container {
		perspective: 1000px;
		perspective-origin: left center;
	}

	/* Pivot out animation - door opening effect */
	.app-entry-content,
	.letter-header,
	.back-button {
		transform-origin: left center;
		transform-style: preserve-3d;
		transition:
			transform 0.15s ease-out,
			opacity 0.15s ease-out;
		backface-visibility: hidden;
	}

	.app-entry-content.pivot-out,
	.letter-header.pivot-out,
	.back-button.pivot-out {
		animation: pivotOut 0.15s ease-out forwards;
	}


	@keyframes pivotOut {
		from {
			transform: rotateY(0deg) scaleY(1);
			opacity: 1;
		}
		to {
			transform: rotateY(-90deg) scaleY(1.7);
			opacity: 0;
		}
	}

	@keyframes shrink {
		from {
			transform: scale(1);
		}
		to {
			transform: scale(0.95);
		}
	}

	@keyframes expand {
		from {
			transform: scale(0.95);
		}
		to {
			transform: scale(1);
		}
	}
</style>
