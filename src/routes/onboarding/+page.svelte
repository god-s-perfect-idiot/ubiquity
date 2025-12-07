<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import Button from '../../components/Button.svelte';
	import {
		accentColorStore,
		textColorClassStore,
		borderColorClassStore,
		backgroundThemeStore
	} from '../../utils/theme';
	import { completeOnboarding, saveOnboardingStage, getSavedOnboardingStage, clearOnboardingStage } from '../../utils/onboarding';
	import { onboardingStages, getTotalStages, getStage } from './stages.js';
	import Loader from '../../components/Loader.svelte';
	import { setContext } from 'svelte';
	import { slide } from 'svelte/transition';

	$: accentColor = $accentColorStore;
	$: textClass = $textColorClassStore;
	$: borderClass = $borderColorClassStore;
	$: backgroundTheme = $backgroundThemeStore;
	$: bottomBarBg = backgroundTheme === 'light' ? '#dedede' : '#1f1f1f';

	// Initialize with 0, will be set from saved value on mount
	let currentStep = 0;
	let isMounted = false;
	let isLoading = true;
	let hideBottomBar = false;
	let restoringFromColorPicker = false;
	
	$: totalSteps = getTotalStages();
	$: currentStage = getStage(currentStep);
	$: StageComponent = currentStage?.component;
	let isExiting = false;
	let isTransitioning = false;
	let slideDirection = 'next'; // 'next' or 'prev'
	let isInitial = true; // Track if this is the first render
	let previousStep = null;
	let PreviousStageComponent = null;

	// Provide context for stages to hide/show bottom bar
	function setHideBottomBar(shouldHide) {
		if (shouldHide) {
			hideBottomBar = true;
			restoringFromColorPicker = false;
		} else {
			// When restoring, set flag to skip button animation
			restoringFromColorPicker = true;
			hideBottomBar = false;
			// Reset flag after animation completes
			setTimeout(() => {
				restoringFromColorPicker = false;
			}, 300);
		}
	}
	setContext('hideBottomBar', setHideBottomBar);

	// Load saved stage on mount (client-side only)
	onMount(() => {
		const savedStage = getSavedOnboardingStage();
		if (savedStage >= 0 && savedStage < totalSteps) {
			currentStep = savedStage;
		}
		isMounted = true;
		isLoading = false;
	});

	// Save stage whenever currentStep changes (but only after mount to avoid overwriting on initial load)
	$: if (isMounted && currentStep >= 0 && currentStep < totalSteps) {
		saveOnboardingStage(currentStep);
	}

	function handleBack() {
		if (isTransitioning) return;

		if (currentStep > 0) {
			isInitial = false;
			isTransitioning = true;
			slideDirection = 'prev';

			// Store previous stage before changing
			previousStep = currentStep;
			const prevStage = getStage(currentStep - 1);
			PreviousStageComponent = prevStage?.component;

			// Start transition - both stages will be visible
			isExiting = true;

			// Change step immediately so new stage appears
			currentStep--;
			saveOnboardingStage(currentStep);

			// Wait for animation to complete, then clean up
			setTimeout(() => {
				isExiting = false;
				previousStep = null;
				PreviousStageComponent = null;
				setTimeout(() => {
					isTransitioning = false;
				}, 50);
			}, 300);
		} else {
			// If on first step, skip onboarding - set flag and complete
			handleCompleteOnboarding();
		}
	}

	function handleNext() {
		if (isTransitioning) return;

		if (currentStep < totalSteps - 1) {
			isInitial = false;
			isTransitioning = true;
			slideDirection = 'next';

			// Store previous stage before changing
			previousStep = currentStep;
			const prevStage = getStage(currentStep);
			PreviousStageComponent = prevStage?.component;

			// Start transition - both stages will be visible
			isExiting = true;

			// Change step immediately so new stage appears
			currentStep++;
			saveOnboardingStage(currentStep);

			// Wait for animation to complete, then clean up
			setTimeout(() => {
				isExiting = false;
				previousStep = null;
				PreviousStageComponent = null;
				setTimeout(() => {
					isTransitioning = false;
				}, 50);
			}, 300);
		} else {
			handleCompleteOnboarding();
		}
	}

	function handleCompleteOnboarding() {
		if (typeof window !== 'undefined') {
			// Set the onboarding completion flag
			completeOnboarding();
			// Clear saved stage
			clearOnboardingStage();
			isExiting = true;
			setTimeout(() => {
				goto('/');
			}, 200);
		}
	}
</script>

{#if isLoading}
	<div class="flex items-center justify-center w-full h-full pt-56">
		<Loader />
	</div>
{:else}
	<div class="">
		<div class="">
			<!-- Step content -->
			<div>
				<!-- Previous stage (exiting) -->
				{#if PreviousStageComponent && isExiting}
					<div
						class="step-content previous-stage"
						class:slide-out-left={slideDirection === 'next'}
						class:slide-out-right={slideDirection === 'prev'}
					>
						<svelte:component this={PreviousStageComponent} />
					</div>
				{/if}

				<!-- Current stage (entering or static) -->
				<div
					class="step-content"
					class:slide-in-right={!isInitial && isExiting && slideDirection === 'next'}
					class:slide-in-left={!isInitial && isExiting && slideDirection === 'prev'}
				>
					{#if StageComponent}
						<svelte:component this={StageComponent} />
					{/if}
				</div>
			</div>
		</div>
	</div>
{/if}

<!-- Bottom buttons -->
{#if !hideBottomBar}
	<div
		class="w-full justify-between flex flex-row fixed bottom-0 right-0 px-4 py-2 gap-8 z-10 bottom-bar"
		class:bottom-bar-exit={isExiting}
		style="background-color: {bottomBarBg};"
		transition:slide={{ axis: 'y', duration: 300 }}
	>
	<div class="btn-animate w-full" class:animate={!isExiting && !restoringFromColorPicker}>
		<Button
			text={currentStep === 0 ? 'skip' : 'back'}
			onClick={handleBack}
			className="!w-full"
			style="background-color: {bottomBarBg} !important;"
		/>
	</div>
	<div class="btn-animate w-full" class:animate={!isExiting && !restoringFromColorPicker}>
		<Button
			text={currentStep === 0 ? 'get started' : currentStep === totalSteps - 1 ? 'done' : 'next'}
			onClick={handleNext}
			className="!w-full"
			style="background-color: {bottomBarBg} !important;"
		/>
	</div>
	</div>
{/if}

<style>
	.step-content {
		opacity: 1;
		transform: translateX(0);
		transition:
			transform 0.3s ease,
			opacity 0.3s ease;
	}

	.step-content.previous-stage {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		width: 100%;
		z-index: 1;
	}

	.step-content:not(.previous-stage) {
		position: relative;
		z-index: 2;
	}

	/* Exit animations */
	.step-content.slide-out-left {
		transform: translateX(-100%);
		opacity: 0;
	}

	.step-content.slide-out-right {
		transform: translateX(100%);
		opacity: 0;
	}

	/* Entry animations */
	.step-content.slide-in-right {
		animation: slideInRight 0.2s ease forwards;
	}

	.step-content.slide-in-left {
		animation: slideInLeft 0.2s ease forwards;
	}

	@keyframes slideInRight {
		from {
			transform: translateX(100%);
			opacity: 0;
		}
		to {
			transform: translateX(0);
			opacity: 1;
		}
	}

	@keyframes slideInLeft {
		from {
			transform: translateX(-100%);
			opacity: 0;
		}
		to {
			transform: translateX(0);
			opacity: 1;
		}
	}

	.btn-animate {
		transform: translateY(120%);
		opacity: 0;
	}

	.btn-animate.animate {
		animation: button-overshoot 0.3s ease-out forwards;
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
