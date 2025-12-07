import { browser } from '$app/environment';

/**
 * Check if onboarding should be shown
 * Shows onboarding if the completion flag doesn't exist, regardless of other data
 */
export function shouldShowOnboarding() {
	if (!browser) return false;
	
	// If onboarding is already complete, don't show it
	const onboardingComplete = localStorage.getItem('ubiquity-onboarding-complete');
	if (onboardingComplete === 'true') {
		return false;
	}

	// Show onboarding if flag doesn't exist (even if there's other data)
	return true;
}

/**
 * Mark onboarding as complete
 */
export function completeOnboarding() {
	if (!browser) return;
	localStorage.setItem('ubiquity-onboarding-complete', 'true');
}

/**
 * Reset onboarding (remove completion flag)
 */
export function resetOnboarding() {
	if (!browser) return;
	localStorage.removeItem('ubiquity-onboarding-complete');
	localStorage.removeItem('ubiquity-onboarding-stage');
}

/**
 * Save current onboarding stage
 */
export function saveOnboardingStage(stageIndex) {
	if (!browser) return;
	localStorage.setItem('ubiquity-onboarding-stage', stageIndex.toString());
}

/**
 * Get saved onboarding stage
 */
export function getSavedOnboardingStage() {
	if (!browser) return 0;
	const saved = localStorage.getItem('ubiquity-onboarding-stage');
	return saved ? parseInt(saved, 10) : 0;
}

/**
 * Clear saved onboarding stage
 */
export function clearOnboardingStage() {
	if (!browser) return;
	localStorage.removeItem('ubiquity-onboarding-stage');
}

