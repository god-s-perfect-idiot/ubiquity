<script>
	import { goto } from '$app/navigation';
	import BottomControls from '../../components/BottomControls.svelte';
	import WeatherDisplay from './WeatherDisplay.svelte';
	import WeatherForecast from './WeatherForecast.svelte';
	import Icon from '@iconify/svelte';
	import { onMount } from "svelte";
	import { borderColorClassStore } from '../../utils/theme';
	
	$: borderClass = $borderColorClassStore;
    
	console.log('Weather page loading...');

	let isExiting = false;
	let isExpanded = false;
	let isUnmounting = false;
	let locationTitle = '';

	function handleToggle(event) {
		isExpanded = event.detail.expanded;
	}

	function closePage() {
		isUnmounting = true;
		setTimeout(() => {
			isExpanded = false;
			setTimeout(() => {
				isExiting = true;
				setTimeout(() => {
					goto('/');
				}, 200); // Match the animation duration
			}, 300); // Allow time for bottom controls to collapse
		}, 300); // Allow time for unmounting animation
	}

    onMount(() => {
        isExpanded = false;
    });
</script>

<div class="page-holder">
	<div class="page pt-4 px-4 flex flex-col h-screen overflow-y-auto" class:page-exit={isExiting}>
		<span class="text-6xl font-[300] mb-8 lowercase"
			>{locationTitle === '' || locationTitle === 'Unknown Location'
				? 'weather'
				: locationTitle}</span
		>
		<!-- Weather Display Component -->
		<WeatherDisplay bind:locationTitle />
		<!-- Weather Forecast Component -->
		<WeatherForecast />
	</div>
</div>

<BottomControls expanded={isExpanded} unmounting={isUnmounting} on:toggle={handleToggle}>
	<div class="flex flex-row gap-12 w-full justify-center items-center">
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

	.page {
		scrollbar-width: thin;
		scrollbar-color: #4a5568 #1a202c;
	}

	.page::-webkit-scrollbar {
		width: 6px;
	}

	.page::-webkit-scrollbar-track {
		background: #1a202c;
	}

	.page::-webkit-scrollbar-thumb {
		background: #4a5568;
		border-radius: 3px;
	}

	.page::-webkit-scrollbar-thumb:hover {
		background: #718096;
	}
</style>
