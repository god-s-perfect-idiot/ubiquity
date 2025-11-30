<script>
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	export let isExiting = false;
	import { addTestDataToFS } from '../../kernel/debug';
	import { kernel } from '../../kernel/store';
	import { addToast } from '../../store/toast';
	import { accountsStore } from '../../store/accounts';
	import { settingsStore } from '../../store/settings';
	import { homescreenStore } from '../../store/homescreen';
	import { appInfoStore } from '../../store/appInfo';
	import { borderColorClassStore, accentColorStore } from '../../utils/theme';
	import Input from '../../components/Input.svelte';

	$: borderClass = $borderColorClassStore;
	$: accentColor = $accentColorStore;

	let userName = '';

	// Load username from localStorage on mount
	onMount(() => {
		if (browser) {
			userName = localStorage.getItem('ubiquity-user-name') || '';
		}
	});

	// Save username to localStorage when it changes
	function handleUserNameChange() {
		if (browser) {
			if (userName.trim()) {
				localStorage.setItem('ubiquity-user-name', userName.trim());
				addToast('Username saved');
			} else {
				localStorage.removeItem('ubiquity-user-name');
			}
		}
	}

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
	<div class="page pt-4 flex flex-col h-screen" class:page-exit={isExiting}>
		<span class="text-6xl font-[300] px-4">data</span>
		<div class="flex flex-col gap-8 mt-6 flex-1 overflow-y-auto px-4 pb-24">
			<span class="text-lg font-[300] text-[#a1a1a1]"
				>Use this page to set information or reset the data on your device. This will reset all
				data, including accounts, settings, and apps.</span
			>
			<div class="flex flex-col gap-4 mt-4">
				<span class="text-xl font-[300]" style="color: {accentColor};">set user information</span>
				<Input bind:content={userName} label="Username" />
				<button
					type="button"
					class="border-2 {borderClass} px-4 py-2 w-fit text-base"
					on:click={handleUserNameChange}>save username</button
				>
				<span class="flex flex-col gap-4 items-start text-sm text-[#a1a1a1]">
					Set your username for publishing live tiles and other content.
				</span>
			</div>
			<div class="flex flex-col gap-4 mt-4">
				<span class="text-xl font-[300]" style="color: {accentColor};">reset data</span>
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
