<script>
	import BottomControls from '../../components/BottomControls.svelte';
	import { goto } from '$app/navigation';
	import Icon from '@iconify/svelte';
	import Data from './Data.svelte';
	import Accounts from './Accounts.svelte';
	import RegionUnits from './RegionUnits.svelte';
	import { onMount } from "svelte";
    
	let isExpanded = false;
	let isUnmounting = false;
	let isExiting = false;
	let currentPage = 'settings';
    let hiddenBottomBar = false;

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
		<div class="page pt-4 px-4 flex flex-col h-screen" class:page-exit={isExiting}>
			<span class="text-6xl font-[300]">settings</span>
			<div class="flex flex-col gap-4 mt-4 flex-1 overflow-y-auto pb-16">
				<div class="flex flex-col gap-3 items-start">
					<span class="text-2xl font-[300] text-[#ff00ff] mt-2">personalization</span>
					<button class="flex flex-col items-start" on:click={() => {}}>
						<span class="text-3xl font-[300] !text-[#414141]">theme</span>
						<span class="text-sm font-[300] text-[#818181] !text-[#414141]"
							>choose light or dark theme. Change accent color.</span
						>
					</button>
					<button class="flex flex-col items-start" on:click={() => {}}>
						<span class="text-3xl font-[300] !text-[#414141]">icon pack</span>
						<span class="text-sm font-[300] text-[#818181] !text-[#414141]"
							>change app pack and app icon overrides</span
						>
					</button>
				</div>
				<div class="flex flex-col gap-3 items-start">
					<span class="text-2xl font-[300] text-[#ff00ff] mt-2">on this device</span>
					<button class="flex flex-col items-start" on:click={() => {}}>
						<span class="text-3xl font-[300] !text-[#414141]">apps</span>
						<span class="text-sm font-[300] text-[#818181] !text-[#414141]"
							>check installed apps</span
						>
					</button>
					<button class="flex flex-col items-start" on:click={() => {}}>
						<span class="text-3xl font-[300] !text-[#414141]">storage</span>
						<span class="text-sm font-[300] text-[#818181] !text-[#414141]"
							>explore local storage usage</span
						>
					</button>
					<button class="flex flex-col items-start" on:click={() => {}}>
						<span class="text-3xl font-[300] !text-[#414141]">security</span>
						<span class="text-sm font-[300] text-[#818181] !text-[#414141]"
							>set your pin code and encryption for your data</span
						>
					</button>
					<button class="flex flex-col items-start" on:click={() => {}}>
						<span class="text-3xl font-[300] !text-[#414141]">ubiquity experience</span>
						<span class="text-sm font-[300] text-[#818181] !text-[#414141]"
							>ubiquity device ID and other unique features</span
						>
					</button>
					<button class="flex flex-col items-start" on:click={() => changePage('accounts')}>
						<span class="text-3xl font-[300]">accounts</span>
						<span class="text-sm font-[300] text-[#818181]"
							>google and other accounts</span
						>
					</button>
					<button class="flex flex-col items-start" on:click={() => changePage('region+units')}>
						<span class="text-3xl font-[300]">region+units</span>
						<span class="text-sm font-[300] text-[#818181]"
							>change region and units of measurements</span
						>
					</button>
				</div>
				<div class="flex flex-col gap-3 items-start">
					<span class="text-2xl font-[300] text-[#ff00ff] mt-2">extras+info</span>
					<button class="flex flex-col items-start" on:click={() => changePage('data')}>
						<span class="text-3xl font-[300]">data</span>
						<span class="text-sm font-[300] text-[#818181]">system data related information</span>
					</button>
					<button class="flex flex-col items-start" on:click={() => {}}>
						<span class="text-3xl font-[300] !text-[#414141]">backups+restore</span>
						<span class="text-sm font-[300] text-[#818181] !text-[#414141]"
							>backup and restore your data</span
						>
					</button>
					<button class="flex flex-col items-start" on:click={() => {}}>
						<span class="text-3xl font-[300] !text-[#414141]">google services</span>
						<span class="text-sm font-[300] text-[#818181] !text-[#414141]"
							>login to google services for importing data</span
						>
					</button>
					<button class="flex flex-col items-start" on:click={() => {}}>
						<span class="text-3xl font-[300] !text-[#414141]">device information</span>
						<span class="text-sm font-[300] text-[#818181] !text-[#414141]"
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
	<Data isExiting={isExiting} />
{:else if currentPage === 'accounts'}
	<Accounts isExiting={isExiting} {hideBottomBar}/>
{:else if currentPage === 'region+units'}
	<RegionUnits isExiting={isExiting} {hideBottomBar}/>
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
					class="flex flex-col border border-white rounded-full !border-2 p-1 font-bold"
				>
					<Icon icon="mdi:skip-previous" width="20" height="20" strokeWidth="2" />
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
				class="flex flex-col border border-white rounded-full !border-2 p-1 font-bold"
			>
				<Icon icon="carbon:close" width="20" height="20" strokeWidth="2" />
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
