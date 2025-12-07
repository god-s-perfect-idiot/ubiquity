/**
 * Onboarding stages configuration
 * Each stage is a component that will be rendered in sequence
 */
import WelcomeStage from './stages/WelcomeStage.svelte';
import DisplaySetupStage from './stages/DisplaySetup.svelte';
import SpotifySetupStage from './stages/SpotifySetup.svelte';
import ImgBBSetupStage from './stages/ImgBBSetup.svelte';
import FinalMessageStage from './stages/FinalMessage.svelte';

export const onboardingStages = [
	{
		id: 'welcome',
		component: WelcomeStage,
	},
	{
		id: 'display-setup',
		component: DisplaySetupStage,
	},
	{
		id: 'spotify-setup',
		component: SpotifySetupStage,
	},
	{
		id: 'imgbb-setup',
		component: ImgBBSetupStage,
	},
	{
		id: 'final-message',
		component: FinalMessageStage,
	}
];

/**
 * Get the total number of stages
 */
export function getTotalStages() {
	return onboardingStages.length;
}

/**
 * Get a stage by index
 */
export function getStage(index) {
	return onboardingStages[index];
}

