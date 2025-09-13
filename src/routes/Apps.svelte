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

	export let onBackClick = () => {};

	const systemApps = [
		{
			name: 'Ubiquity',
			content: '/about',
			isSystemApp: true,
			icon: 'mdi:information',
			bgColor: 'bg-[#ff00ff]'
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
			name: 'Documents',
			content: '/documents',
			isSystemApp: true,
			icon: 'ix:document-filled',
			bgColor: 'bg-red-700'
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

	function handleTouchStart(appName) {
		isLongPress = false;
		pressTimer = setTimeout(() => {
			isLongPress = true;
			handleLongPress(appName);
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

		showMenu = null;
		isExiting = true;
		setTimeout(() => {
			isExiting = false;
		}, 500);
		addToast(`${appName} removed`, 2000);
	}

	$: {
		if (showMenu !== null) {
			isEntering = true;
			setTimeout(() => {
				isEntering = false;
			}, 500); // Match this to the animation duration
		}
	}

	onMount(() => {
		window.oncontextmenu = () => {
			return false;
		};
	});
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
	<div class="flex flex-row gap-2 w-full h-screen">
		<button
			class="fixed left-0 flex flex-col border h-10 w-10 mt-5 ml-6 justify-center items-center border-white rounded-full !border-2 p-2 font-bold"
			on:click={onBackClick}
		>
			<Icon icon="subway:left-arrow" width="18" height="18" strokeWidth="2" />
		</button>
		<div
			class={`pt-4 flex gap-2 flex-col pb-16 overflow-y-auto w-full h-full 
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
						class={`ml-24 text-[#ff00ff] text-3xl lowercase border-2 w-12 h-12 border-[#ff00ff] justify-start items-end flex pl-1 pb-1`}
						id={appEntry[0].toUpperCase()}
						on:click={() => {
							showGrid = true;
						}}
					>
						{appEntry[0]}
					</div>
					{#each appEntry[1] as app}
						<div
							class="flex flex-col relative"
							on:touchstart={() => handleTouchStart(app.name)}
							on:touchend={handleTouchEnd}
							on:touchcancel={handleTouchEnd}
							on:touchMove={handleTouchEnd}
						>
							<div
								class={`ml-24 flex flex-row gap-4 items-center ${showMenu === app.name ? 'active' : ''}`}
							>
								{#if app.isSystemApp}
									<span
										class={`w-12 h-12 bg-[#ff00ff] justify-center items-center flex text-white font-[300] ${app.bgColor}`}
									>
										<Icon icon={app.icon} width="32" height="32" />
									</span>
								{:else if faviconCache[app.name]}
									<img
										src={faviconCache[app.name].url}
										alt={`${app.name} icon`}
										class={`w-12 h-12 object-contain p-1 ${faviconCache[app.name].bgColor}`}
										on:error={(e) => {
											// Fallback to letter if image fails to load
											e.target.style.display = 'none';
											e.target.nextElementSibling.style.display = 'flex';
										}}
									/>
									<span
										class={`w-12 h-12 bg-[#ff00ff] justify-center items-center flex text-white font-[300] hidden`}
										>{app.name.charAt(0).toUpperCase()}</span
									>
								{:else}
									<span
										class={`w-12 h-12 bg-[#ff00ff] justify-center items-center flex text-white font-[300]`}
										>{app.name.charAt(0).toUpperCase()}</span
									>
								{/if}
								<a
									href={app.content}
									on:click={(event) => showMenu !== null && event.preventDefault()}
								>
									{app.name}
								</a>
							</div>
							{#if showMenu === app.name}
								<div class="app-menu">
									<AppMenu
										isSystemApp={app.isSystemApp}
										onRemove={() => handleRemoveApp(app.name)}
									/>
								</div>
							{/if}
						</div>
					{/each}
				</div>
			{/each}
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
