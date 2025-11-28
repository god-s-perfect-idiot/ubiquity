<script>
	export let isExiting = false;
	import { addTestDataToFS } from '../../kernel/debug';
	import { kernel } from '../../kernel/store';
	import { addToast } from '../../store/toast';
	import { accountsStore } from '../../store/accounts';
	import { settingsStore } from '../../store/settings';
	import { homescreenStore } from '../../store/homescreen';
	import { appInfoStore } from '../../store/appInfo';
	import { borderColorClassStore } from '../../utils/theme';

	$: borderClass = $borderColorClassStore;

	const addData = () => {
		addTestDataToFS();
		addToast('Started data successfully added to device');
	};

	const resetSettings = () => {
		settingsStore.resetAll();
		addToast('Settings reset successfully');
	};

	const removeAccounts = () => {
		accountsStore.logout('spotify');
		accountsStore.cleanupStorage('spotify');
	};

	const resetAccounts = () => {
		removeAccounts();
		addToast('Accounts reset successfully');
	};

	const resetData = () => {
		kernel.fs.resetFS();
		removeAccounts();
		settingsStore.resetAll();
		homescreenStore.resetAll();
		appInfoStore.resetAll();
		addToast('Data reset successfully');
	};
</script>

<div class="page-holder">
	<div class="page pt-4 px-4 flex flex-col h-screen" class:page-exit={isExiting}>
		<span class="text-6xl font-[300]">data</span>
		<div class="flex flex-col gap-8 mt-6 flex-1 overflow-y-auto">
			<span class="text-lg font-[300] text-[#a1a1a1]"
				>Use this page to reset the data on your device. This will reset all data, including
				accounts, settings, and apps.</span
			>
			<div class="flex flex-col gap-4 mt-4">
				<button
					type="button"
					class="border-2 {borderClass} px-4 py-2 w-fit text-base"
					on:click={resetAccounts}>remove all accounts</button
				>
				<span class="flex flex-col gap-4 items-start text-sm text-[#a1a1a1]">
					Remove all accounts from your device.
				</span>
			</div>
			<div class="flex flex-col gap-4">
				<button
					type="button"
					class="border-2 border-white px-4 py-2 w-fit text-base"
					on:click={resetSettings}>reset settings</button
				>
				<span class="flex flex-col gap-4 items-start text-sm text-[#a1a1a1]">
					Reset all settings to default.
				</span>
			</div>
			<div class="flex flex-col gap-4">
				<button
					type="button"
					class="border-2 border-white px-4 py-2 w-fit text-base"
					on:click={resetData}>reset data</button
				>
				<span class="flex flex-col gap-4 items-start text-sm text-[#a1a1a1]">
					Remove all data from your device.
				</span>
			</div>
			<div class="flex flex-col gap-4">
				<button
					type="button"
					class="border-2 border-white px-4 py-2 w-fit text-base"
					on:click={addData}>load starter data</button
				>
				<span class="flex flex-col gap-4 items-start text-sm text-[#a1a1a1]">
					This setting adds a few apps, documents, music, videos, etc to your device.
				</span>
			</div>
		</div>
	</div>
</div>
