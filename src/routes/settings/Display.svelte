<script>
	export let isExiting = false;
	import { settingsStore } from '../../store/settings';
	import Switch from '../../components/Switch.svelte';

	let showMoreCols = false;
	$: showMoreCols = settingsStore.get('appearance.showMoreCols') || false;
</script>

<div class="page-holder">
	<div class="page pt-4 px-4 flex flex-col h-screen" class:page-exit={isExiting}>
		<span class="text-6xl font-[300]">display</span>
		<div class="flex flex-col gap-8 mt-8 flex-1 overflow-y-auto">
			<div class="flex flex-col gap-4">
				<Switch
					title="Show More Columns"
					description="Show more columns in the start menu."
					bind:value={showMoreCols}
					onToggle={(value) => {
						settingsStore.updateSettings({ 'appearance.showMoreCols': value });
					}}
				/>
			</div>
		</div>
	</div>
</div>
