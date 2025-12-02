<script>
	import BottomControls from '../../components/BottomControls.svelte';
	import { goto } from '$app/navigation';
	import Icon from '@iconify/svelte';
	import Data from './Data.svelte';
	import Accounts from './Accounts.svelte';
	import RegionUnits from './RegionUnits.svelte';
	import Search from './Search.svelte';
	import { onMount } from 'svelte';
	import Display from './Display.svelte';
	import Theme from './Theme.svelte';
	import Apps from './Apps.svelte';
	import Storage from './Storage.svelte';
	import DeviceInfo from './DeviceInfo.svelte';
	import { accentColorStore, borderColorClassStore, backgroundThemeStore } from '../../utils/theme';

	let isExpanded = false;
	let isUnmounting = false;
	let isExiting = false;
	let currentPage = 'settings';
	let hiddenBottomBar = false;
	
	// Get accent color reactively from store
	$: accentColor = $accentColorStore;
	$: borderClass = $borderColorClassStore;
	$: backgroundTheme = $backgroundThemeStore;
	// Invert disabled text color: use light gray in light mode, dark gray in dark mode
	$: disabledTextColor = backgroundTheme === 'light' ? '#bebebe' : '#414141';

	const handleToggle = () => {
		isExpanded = !isExpanded;
	};

	const hideBottomBar = (show) => {
		hiddenBottomBar = show;
	};

	const closePage = () => {
		isUnmounting = true;
		setTimeout(() => {
			isExpanded = false;
			setTimeout(() => {
				isExiting = true;
				setTimeout(() => {
					goto('/');
				}, 200); // Match the animation duration
			}, 300); // Allow time for bottom controls to collapse
		}, 300);
	};

	const goToTopPage = () => {
		currentPage = 'settings';
		isExpanded = false;
	};

	const changePage = (page) => {
		currentPage = page;
		isExpanded = false;
	};

	onMount(() => {
		isExpanded = false;
	});
</script>

{#if currentPage === 'settings'}
	<div class="page-holder">
		<div class="page pt-4 flex flex-col h-screen" class:page-exit={isExiting}>
			<span class="text-6xl font-[300] px-4">settings</span>
			<div class="flex flex-col gap-4 mt-4 flex-1 overflow-y-auto pb-16 px-4">
				<div class="flex flex-col gap-3 items-start">
					<span class="text-2xl font-[300] mt-2" style="color: {accentColor}">personalization</span>
					<button class="flex flex-col items-start" on:click={() => {changePage('display')}}>
						<span class="text-3xl font-[300]">display</span>
						<span class="text-sm font-[300] text-[#818181]"
							>change display settings.</span
						>
					</button>
					<button class="flex flex-col items-start" on:click={() => {changePage('theme')}}>
						<span class="text-3xl font-[300]" >start + theme</span>
						<span class="text-sm font-[300] text-[#818181]"
							>choose light or dark theme. Change accent color.</span
						>
					</button>
					<button class="flex flex-col items-start" on:click={() => {}}>
						<span class="text-3xl font-[300]" style="color: {disabledTextColor};">icon pack</span>
						<span class="text-sm font-[300] text-[#818181]" style="color: {disabledTextColor};"
							>change app pack and app icon overrides</span
						>
					</button>
				</div>
				<div class="flex flex-col gap-3 items-start">
					<span class="text-2xl font-[300] mt-2" style="color: {accentColor}">on this device</span>
					<button class="flex flex-col items-start" on:click={() => {changePage('apps')}}>
						<span class="text-3xl font-[300]">apps</span>
						<span class="text-sm font-[300] text-[#818181]"
							>check installed apps</span
						>
					</button>
					<button class="flex flex-col items-start" on:click={() => {changePage('storage')}}>
						<span class="text-3xl font-[300]">storage</span>
						<span class="text-sm font-[300] text-[#818181]"
							>explore local storage usage</span
						>
					</button>
					<button class="flex flex-col items-start" on:click={() => {}}>
						<span class="text-3xl font-[300]" style="color: {disabledTextColor};">security</span>
						<span class="text-sm font-[300] text-[#818181]" style="color: {disabledTextColor};"
							>set your pin code and encryption for your data</span
						>
					</button>
					<button class="flex flex-col items-start" on:click={() => {}}>
						<span class="text-3xl font-[300]" style="color: {disabledTextColor};">ubiquity experience</span>
						<span class="text-sm font-[300] text-[#818181]" style="color: {disabledTextColor};"
							>ubiquity device ID and other unique features</span
						>
					</button>
					<button class="flex flex-col items-start" on:click={() => changePage('search')}>
						<span class="text-3xl font-[300]">search</span>
						<span class="text-sm font-[300] text-[#818181]">change search engine and settings</span>
					</button>
					<button class="flex flex-col items-start" on:click={() => changePage('accounts')}>
						<span class="text-3xl font-[300]">accounts</span>
						<span class="text-sm font-[300] text-[#818181]">google and other accounts</span>
					</button>
					<button class="flex flex-col items-start" on:click={() => changePage('region+units')}>
						<span class="text-3xl font-[300]">region+units</span>
						<span class="text-sm font-[300] text-[#818181]"
							>change region and units of measurements</span
						>
					</button>
				</div>
				<div class="flex flex-col gap-3 items-start">
					<span class="text-2xl font-[300] mt-2" style="color: {accentColor}">extras+info</span>
					<button class="flex flex-col items-start" on:click={() => changePage('data')}>
						<span class="text-3xl font-[300]">data</span>
						<span class="text-sm font-[300] text-[#818181]">system data related information</span>
					</button>
					<button class="flex flex-col items-start" on:click={() => {}}>
						<span class="text-3xl font-[300]" style="color: {disabledTextColor};">backups+restore</span>
						<span class="text-sm font-[300] text-[#818181]" style="color: {disabledTextColor};"
							>backup and restore your data</span
						>
					</button>
					<button class="flex flex-col items-start" on:click={() => {}}>
						<span class="text-3xl font-[300]" style="color: {disabledTextColor};">google services</span>
						<span class="text-sm font-[300] text-[#818181]" style="color: {disabledTextColor};"
							>login to google services for importing data</span
						>
					</button>
					<button class="flex flex-col items-start" on:click={() => {changePage('device-info')}}>
						<span class="text-3xl font-[300]">device information</span>
						<span class="text-sm font-[300] text-[#818181]"
							>get device level information using navigator</span
						>
					</button>
					<button class="flex flex-col items-start" on:click={() => goto('/about')}>
						<span class="text-3xl font-[300]">about the project</span>
						<span class="text-sm font-[300] text-[#818181]">learn more about ubiquity</span>
					</button>
				</div>
			</div>
		</div>
	</div>
{:else if currentPage === 'data'}
	<Data {isExiting} />
{:else if currentPage === 'accounts'}
	<Accounts {isExiting} {hideBottomBar} />
{:else if currentPage === 'region+units'}
	<RegionUnits {isExiting} {hideBottomBar} />
{:else if currentPage === 'search'}
	<Search {isExiting} {hideBottomBar} />
{:else if currentPage === 'display'}
	<Display {isExiting} {hideBottomBar} />
{:else if currentPage === 'theme'}
	<Theme {isExiting} {hideBottomBar} />
{:else if currentPage === 'apps'}
	<Apps {isExiting} {hideBottomBar} />
{:else if currentPage === 'storage'}
	<Storage {isExiting} />
{:else if currentPage === 'device-info'}
	<DeviceInfo {isExiting} />
{/if}

{#if !hiddenBottomBar}
	<BottomControls expanded={isExpanded} unmounting={isUnmounting} on:toggle={handleToggle}>
		<div class="flex flex-row gap-12 justify-center items-center">
			{#if currentPage !== 'settings'}
				<div
					class="btn-animate flex flex-col gap-2 justify-center items-center"
					class:animate={isExpanded}
				>
					<button
						on:click={goToTopPage}
						class="flex flex-col border {borderClass} rounded-full !border-2 p-2 font-bold"
					>
						<Icon icon="subway:left-arrow" width="18" height="18" strokeWidth="4" />
					</button>
					<span class="text-xs font-[400]">back</span>
				</div>
			{/if}
			<div
				class="btn-animate flex flex-col gap-2 justify-center items-center"
				class:animate={isExpanded}
			>
				<button
					on:click={closePage}
					class="flex flex-col border {borderClass} rounded-full !border-2 p-2 font-bold"
				>
					<Icon icon="rivet-icons:close" width="18" height="18" strokeWidth="2" />
				</button>
				<span class="text-xs font-[400]">close</span>
			</div>
		</div>
	</BottomControls>
{/if}

<style>
	.btn-animate {
		transform: translateY(120%);
		opacity: 0;
	}

	.btn-animate.animate {
		animation: button-overshoot 0.5s ease-out forwards;
		opacity: 1;
	}

	@keyframes button-overshoot {
		0% {
			transform: translateY(120%);
		}
		70% {
			transform: translateY(-20%);
		}
		100% {
			transform: translateY(0);
		}
	}
</style>
