/**
 * Onboarding stages configuration
 * Each stage is a component that will be rendered in sequence
 */
import WelcomeStage from './stages/WelcomeStage.svelte';
import DisplaySetupStage from './stages/DisplaySetup.svelte';
import LockScreenSetupStage from './stages/LockScreenSetup.svelte';
import UnitsLocationSetupStage from './stages/UnitsLocationSetup.svelte';
import LiveTilesIntroStage from './stages/LiveTilesIntro.svelte';
import AddResourceIntroStage from './stages/AddResourceIntro.svelte';
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
		id: 'lockscreen-setup',
		component: LockScreenSetupStage,
	},
	{
		id: 'units-location-setup',
		component: UnitsLocationSetupStage,
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
		id: 'live-tiles-intro',
		component: LiveTilesIntroStage,
	},
	{
		id: 'add-resource-intro',
		component: AddResourceIntroStage,
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

