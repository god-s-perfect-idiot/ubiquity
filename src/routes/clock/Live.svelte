<script>
	import { onMount, onDestroy } from 'svelte';
	import { accentColorStore, textColorClassStore } from '../../utils/theme';

	$: accentColor = $accentColorStore;
	$: textColor = $textColorClassStore;

	export let gridSize = '2x2'; // '2x2' or '4x2'

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
		const months = [
			'January',
			'February',
			'March',
			'April',
			'May',
			'June',
			'July',
			'August',
			'September',
			'October',
			'November',
			'December'
		];

		const dayName = days[date.getDay()];
		const monthName = months[date.getMonth()];
		const day = date.getDate();
		const year = date.getFullYear();

		return {
			dayName: dayName,
			monthName: monthName,
			day: day,
			year: year
		};
	}

	onMount(() => {
		updateTime();
		timeInterval = setInterval(updateTime, 1000);
	});

	onDestroy(() => {
		if (timeInterval) {
			clearInterval(timeInterval);
		}
	});

	$: timeDisplay = formatTime(currentTime);
	$: dateDisplay = formatDate(currentTime);
</script>

{#if gridSize === '2x2'}
	<!-- 2x2 Tile: Compact time display -->
	<div
		class="w-full h-full flex flex-col justify-center items-center {textColor}"
		style="background-color: {accentColor};"
	>
		<div class="flex flex-col self-end items-center h-full justify-center">
			<div class="flex flex-row items-baseline gap-1 self-end justify-center text-6xl font-[200]">
				{timeDisplay.hours}:{timeDisplay.minutes}
			</div>
			<span class="text-base font-[300] self-end mr-1">{timeDisplay.ampm}</span>
		</div>
		<div class="flex flex-col self-start items-start w-full p-1 absolute bottom-0 left-0">
			<span class="text-base font-[500]">{dateDisplay.dayName}</span>
			<span class="text-base font-[300]"
				>{dateDisplay.monthName} {dateDisplay.day}, {dateDisplay.year}</span
			>
		</div>
	</div>
{:else if gridSize === '4x2'}
	<!-- 4x2 Tile: Full time and date display -->
	<div
		class="w-full h-full flex flex-col justify-center items-start {textColor}"
		style="background-color: {accentColor};"
	>
		<div class="flex flex-col gap-3 w-full h-full justify-center">
			<div class="flex flex-row items-center justify-center h-full">
				<span class="text-7xl font-[200]">{timeDisplay.hours}</span>
				<span class="text-7xl font-[200]">:</span>
				<span class="text-7xl font-[200]">{timeDisplay.minutes}</span>
				<span class="text-4xl font-[200] ml-2">{timeDisplay.ampm}</span>
			</div>
            <div class="flex flex-col self-start items-start w-full p-1 absolute bottom-0 left-0">
				<span class="text-base font-[500] self-start">{dateDisplay.dayName}</span>
				<span class="text-base font-[300] self-start">{dateDisplay.monthName} {dateDisplay.day}, {dateDisplay.year}</span>
			</div>
		</div>
	</div>
{/if}
