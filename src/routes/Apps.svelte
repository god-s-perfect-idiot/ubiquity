<!-- This is the ugliest code I've written. -->
<script>
	import { onMount, tick } from 'svelte';
	import { fetchApps } from '../kernel/system-utils';
	import { kernel } from '../kernel/store';
	import AppMenu from '../components/AppMenu.svelte';
	import LetterGrid from '../components/LetterGrid.svelte';
	import { addToast } from '../store/toast';

	const systemApps = [
		{
			name: 'Ubiquity',
			content: '/about',
			isSystemApp: true
		},
		{
			name: 'Settings',
			content: '/settings',
			isSystemApp: true
		},
		{ name: 'Files', content: '/files', isSystemApp: true },
		{ name: 'Photos', content: '/photos', isSystemApp: true },
		{ name: 'Music', content: '/music', isSystemApp: true },
		{ name: 'Video', content: '/video', isSystemApp: true },
		{ name: 'Documents', content: '/documents', isSystemApp: true },
		{ name: 'Marketplace', content: '/marketplace', isSystemApp: true }
	];
	let apps = [];

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
		appList[appName.charAt(0).toUpperCase()] = appList[appName.charAt(0).toUpperCase()].filter((app) => app.name !== appName);
		if (appList[appName.charAt(0).toUpperCase()].length === 0) {
			delete appList[appName.charAt(0).toUpperCase()];
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
		showGrid={showGrid}
		isExiting={isExiting}
		onLetterClick={handleLetterClick}
	/>
{:else}
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<div
		class={`mt-4 flex gap-2 flex-col mb-16 
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
					class={`ml-16 text-[#ff00ff] text-3xl lowercase border-2 w-12 h-12 border-[#ff00ff] justify-start items-end flex pl-1 pb-1`}
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
							class={`ml-16 flex flex-row gap-4 items-center ${showMenu === app.name ? 'active' : ''}`}
						>
							<span class={`w-12 h-12 bg-[#ff00ff] justify-center items-center flex`}
								>{appEntry[0]}</span
							>
							<a
								href={app.content}
								on:click={(event) => showMenu !== null && event.preventDefault()}
							>
								{app.name}
							</a>
						</div>
						{#if showMenu === app.name}
							<div class="app-menu">
								<AppMenu isSystemApp={app.isSystemApp} onRemove={() => handleRemoveApp(app.name)} />
							</div>
						{/if}
					</div>
				{/each}
			</div>
		{/each}
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
