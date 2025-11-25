<script>
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import BottomControls from '../../components/BottomControls.svelte';
	import Icon from '@iconify/svelte';
	import { borderColorClassStore } from '../../utils/theme';
	
	$: borderClass = $borderColorClassStore;
	
	let isExiting = false;
	let isExpanded = false;
	let isUnmounting = false;
	let currentTime = new Date();
	let timeInterval;

	function updateTime() {
		currentTime = new Date();
	}

	function formatTime(date) {
		const hours = date.getHours();
		const minutes = date.getMinutes();
		const seconds = date.getSeconds();
		const ampm = hours >= 12 ? 'PM' : 'AM';
		const displayHours = hours % 12 || 12;
		
		return {
			hours: displayHours.toString().padStart(2, '0'),
			minutes: minutes.toString().padStart(2, '0'),
			seconds: seconds.toString().padStart(2, '0'),
			ampm
		};
	}

	function formatDate(date) {
		const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
		const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
		
		const dayName = days[date.getDay()];
		const monthName = months[date.getMonth()];
		const day = date.getDate();
		const year = date.getFullYear();
		
		return `${dayName}, ${monthName} ${day}, ${year}`;
	}

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
		updateTime();
		timeInterval = setInterval(updateTime, 1000);
		isExpanded = false;
	});

	onDestroy(() => {
		if (timeInterval) {
			clearInterval(timeInterval);
		}
	});

	$: timeDisplay = formatTime(currentTime);
	$: dateDisplay = formatDate(currentTime);
</script>

<div class="page-holder">
	<div class="page pt-4 px-4 flex flex-col h-screen overflow-y-auto" class:page-exit={isExiting}>
		<span class="text-6xl font-[300] lowercase mb-8">date & time</span>
		
		<div class="flex flex-col flex-1 gap-2">
			<!-- Time Display -->
			<div class="flex flex-col gap-4 mt-16">
				<div class="flex flex-row items-baseline gap-2 w-full">
					<span class="text-6xl font-[300]">{timeDisplay.hours}</span>
					<span class="text-6xl font-[300]">:</span>
					<span class="text-6xl font-[300]">{timeDisplay.minutes}</span>
					<span class="text-3xl font-[300] opacity-60">{timeDisplay.seconds}</span>
					<span class="text-5xl font-[300] ml-2">{timeDisplay.ampm}</span>
				</div>
			</div>
			
			<!-- Date Display -->
			<div class="flex flex-col gap-2 mt-2">
				<span class="text-2xl font-[300] opacity-80">{dateDisplay}</span>
			</div>
		</div>
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

