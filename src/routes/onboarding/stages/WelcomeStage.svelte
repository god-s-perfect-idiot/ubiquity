<script>
	import { accentColorStore, textColorClassStore } from '../../../utils/theme';
	import Icon from '@iconify/svelte';
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';

	$: accentColor = $accentColorStore;
	$: textClass = $textColorClassStore;

	let deviceName = 'Generic Device';

	onMount(() => {
		if (browser && typeof navigator !== 'undefined') {
			deviceName = navigator.platform || navigator.userAgentData?.platform || 'Generic Device';
		}
	});
</script>

<div class="flex flex-col gap-4 items-start justify-start w-full h-full">
	<span class="text-4xl text-left w-full {textClass}">Welcome to your Ubiquity Setup</span>

	<div class="my-2 flex flex-row gap-2 text-xl items-center">
		<Icon icon="ic:sharp-phone-android" width="28" height="28" class="text-white" />
		{deviceName}
	</div>

	<p class="text-lg {textClass }">
		Lets get started.
	</p>
</div>

<style>
	.stage-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		gap: 1.5rem;
	}

	.icon-container {
		width: 120px;
		height: 120px;
		border-radius: 50%;
		background-color: var(--accent-color);
		display: flex;
		align-items: center;
		justify-content: center;
		opacity: 0.9;
		margin-bottom: 1rem;
	}

	.stage-title {
		font-size: 2rem;
		font-weight: 300;
		margin: 0;
	}

	.stage-description {
		font-size: 1.125rem;
		line-height: 1.6;
		opacity: 0.8;
		margin: 0;
		max-width: 500px;
	}
</style>
