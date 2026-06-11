<script>
	import { createEventDispatcher, onMount } from 'svelte';
	import { borderColorClassStore, textColorClassStore } from '../utils/theme';

	export let label = '';
	export let description = '';
	export let previewText = 'Sample';
	export let previewFontSize = '1.5rem';
	export let steps = 8;
	export let value = 0;
	export let className = '';

	const dispatch = createEventDispatcher();

	let trackEl;
	let dragging = false;

	$: textClass = $textColorClassStore;
	$: borderClass = $borderColorClassStore;
	$: clampedValue = Math.min(steps - 1, Math.max(0, value));
	$: segmentWidth = 100 / steps;
	$: thumbLeft = clampedValue * segmentWidth;
	$: thumbWidth = segmentWidth * 0.22;

	function setValue(index) {
		const next = Math.min(steps - 1, Math.max(0, index));
		if (next === clampedValue) return;

		value = next;
		dispatch('change', next);
	}

	function getStepFromClientX(clientX) {
		if (!trackEl) return clampedValue;

		const rect = trackEl.getBoundingClientRect();
		const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
		return Math.min(steps - 1, Math.max(0, Math.floor(ratio * steps)));
	}

	function handleTrackPointerDown(event) {
		if (event.pointerType === 'mouse' && event.button !== 0) return;

		dragging = true;
		trackEl.setPointerCapture(event.pointerId);
		setValue(getStepFromClientX(event.clientX));
	}

	function handleTrackPointerMove(event) {
		if (!dragging) return;
		setValue(getStepFromClientX(event.clientX));
	}

	function handleTrackPointerUp(event) {
		if (!dragging) return;

		dragging = false;
		if (trackEl?.hasPointerCapture(event.pointerId)) {
			trackEl.releasePointerCapture(event.pointerId);
		}
	}

	function handleKeydown(event) {
		if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
			event.preventDefault();
			setValue(clampedValue - 1);
		} else if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
			event.preventDefault();
			setValue(clampedValue + 1);
		} else if (event.key === 'Home') {
			event.preventDefault();
			setValue(0);
		} else if (event.key === 'End') {
			event.preventDefault();
			setValue(steps - 1);
		}
	}

	onMount(() => {
		return () => {
			dragging = false;
		};
	});
</script>

<div class="flex flex-col gap-4 {className}">
	{#if label}
		<span class="text-sm font-[300] text-[#a1a1a1]">{label}</span>
	{/if}

	<div class="border-2 {borderClass} px-4 py-6 min-h-[5.5rem] flex items-center">
		<span class="{textClass} font-[300] leading-none" style="font-size: {previewFontSize};">
			{previewText}
		</span>
	</div>

	<div
		bind:this={trackEl}
		class="step-slider"
		role="slider"
		aria-label={label || 'Step slider'}
		aria-valuemin="0"
		aria-valuemax={steps - 1}
		aria-valuenow={clampedValue}
		tabindex="0"
		on:pointerdown={handleTrackPointerDown}
		on:pointermove={handleTrackPointerMove}
		on:pointerup={handleTrackPointerUp}
		on:pointercancel={handleTrackPointerUp}
		on:keydown={handleKeydown}
	>
		<div class="step-slider__track">
			<div class="step-slider__segments" aria-hidden="true">
				{#each Array(steps) as _, index}
					<div class="step-slider__segment"></div>
				{/each}
			</div>
			{#each Array(steps + 1) as _, index}
				<div
					class="step-slider__tick"
					style="left: {(index / steps) * 100}%"
					aria-hidden="true"
				></div>
			{/each}
			<div
				class="step-slider__thumb"
				style="left: {thumbLeft}%; width: {thumbWidth}%"
				aria-hidden="true"
			></div>
		</div>
	</div>

	{#if description}
		<span class="text-sm font-[400] text-[#a1a1a1]">{description}</span>
	{/if}
</div>

<style>
	.step-slider {
		position: relative;
		height: 2.5rem;
		display: flex;
		align-items: center;
		cursor: pointer;
		touch-action: none;
		outline: none;
	}

	.step-slider__track {
		position: relative;
		width: 100%;
		height: 0.5rem;
	}

	.step-slider__segments {
		display: flex;
		width: 100%;
		height: 100%;
	}

	.step-slider__segment {
		flex: 1;
		height: 100%;
		background-color: #3a3a3a;
	}

	.step-slider__tick {
		position: absolute;
		top: 0;
		width: 2px;
		height: 100%;
		background-color: #1f1f1f;
		transform: translateX(-50%);
		pointer-events: none;
	}

	.step-slider__thumb {
		position: absolute;
		top: 50%;
		height: 2rem;
		background-color: #ffffff;
		transform: translate(-50%, -50%);
		pointer-events: none;
		transition: left 0.1s ease-out;
	}

	.step-slider:active .step-slider__thumb,
	.step-slider:focus-visible .step-slider__thumb {
		transition: none;
	}
</style>
