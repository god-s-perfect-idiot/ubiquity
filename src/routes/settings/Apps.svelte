<script>
	import Icon from '@iconify/svelte';
	import Button from '../../components/Button.svelte';
	import Input from '../../components/Input.svelte';
	import { onMount } from 'svelte';
	import { appInfoStore } from '../../store/appInfo.js';
	import { kernel } from '../../kernel/store.js';
	import { fetchApps } from '../../kernel/system-utils.js';
	import { addToast } from '../../store/toast.js';
	import {
		accentColorStore,
		borderColorClassStore,
		backgroundThemeStore,
		textColorClassStore
	} from '../../utils/theme.js';
	import { getFaviconUrls } from '../../kernel/favicon-utils.js';

	export let isExiting = false;
	export let hideBottomBar = () => {};

	$: accentColor = $accentColorStore;
	$: backgroundTheme = $backgroundThemeStore;
	$: textClass = $textColorClassStore;
	$: bottomBarBg = backgroundTheme === 'light' ? '#dedede' : '#1f1f1f';

	// Default fields to show for app info
	const defaultAppInfoFields = [
		'name',
		'icon',
		'bgColor',
		'backgroundColor',
		'description',
		'category',
		'url'
	];

	let apps = [];
	let selectedApp = null;
	let appInfo = {};
	let appInfoStrings = {}; // Store string representations for editing
	let faviconCache = {};

	onMount(() => {
		hideBottomBar(false);
		loadApps();
	});

	function loadApps() {
		const installedApps = fetchApps(kernel.fs.getFiles());
		apps = installedApps.sort((a, b) => a.name.localeCompare(b.name));

		// Get favicon URLs for external apps
		faviconCache = getFaviconUrls(installedApps);
	}

	function showAppDetail(app) {
		selectedApp = app;
		
		// Get appInfo from store - try multiple keys
		const storedInfo = 
			appInfoStore.getAppInfo(app.name) ||
			appInfoStore.getAppInfo(app.content) ||
			appInfoStore.getAppInfo(app.url) ||
			{};
		
		// Initialize with default fields
		appInfo = {};
		appInfoStrings = {};
		
		// If no stored info, initialize all default fields as empty strings
		if (Object.keys(storedInfo).length === 0) {
			defaultAppInfoFields.forEach(field => {
				appInfo[field] = '';
				appInfoStrings[field] = '';
			});
		} else {
			// Create a copy for editing
			const copiedInfo = JSON.parse(JSON.stringify(storedInfo));
			
			// Only include default fields, ensure all default fields exist
			defaultAppInfoFields.forEach(field => {
				if (field in copiedInfo) {
					appInfo[field] = copiedInfo[field];
				} else {
					appInfo[field] = '';
				}
				
				// Create string representation
				appInfoStrings[field] = typeof appInfo[field] === 'object' 
					? JSON.stringify(appInfo[field], null, 2) 
					: String(appInfo[field]);
			});
		}
		
		hideBottomBar(true);
	}

	function showMainPage() {
		selectedApp = null;
		appInfo = {};
		appInfoStrings = {};
		hideBottomBar(false);
	}

	function saveAppInfo() {
		if (!selectedApp) return;

		// Only save default fields with non-empty values
		const cleanedAppInfo = {};
		defaultAppInfoFields.forEach(field => {
			const value = appInfo[field];
			// Only include non-empty values
			if (value !== '' && value !== null && value !== undefined) {
				// For string values, also check if trimmed is not empty
				if (typeof value === 'string' && value.trim() !== '') {
					cleanedAppInfo[field] = value.trim();
				} else if (typeof value !== 'string') {
					cleanedAppInfo[field] = value;
				}
			}
		});

		// Save to appInfo store using all possible keys
		const keys = [selectedApp.name];
		if (selectedApp.content) keys.push(selectedApp.content);
		if (selectedApp.url) keys.push(selectedApp.url);

		keys.forEach((key) => {
			appInfoStore.setAppInfo(key, cleanedAppInfo);
		});

		addToast('App info saved successfully');
		showMainPage();
	}

	function updateProperty(key, stringValue) {
		appInfoStrings[key] = stringValue;
		// Try to parse as JSON if it looks like JSON
		let parsedValue = stringValue;
		try {
			if (stringValue.trim().startsWith('{') || stringValue.trim().startsWith('[')) {
				parsedValue = JSON.parse(stringValue);
			}
		} catch {
			// Keep as string if parsing fails
			parsedValue = stringValue;
		}
		appInfo = {
			...appInfo,
			[key]: parsedValue
		};
	}

	function getAppIcon(app) {
		const storedInfo =
			appInfoStore.getAppInfo(app.name) ||
			appInfoStore.getAppInfo(app.content) ||
			appInfoStore.getAppInfo(app.url);

		// Check if icon is a URL (starts with http:// or https://)
		if (storedInfo?.icon && (storedInfo.icon.startsWith('http://') || storedInfo.icon.startsWith('https://'))) {
			return storedInfo.icon;
		}
		
		// Fallback to favicon cache
		return faviconCache[app.name]?.url || null;
	}

	function getAppBgColor(app) {
		const storedInfo =
			appInfoStore.getAppInfo(app.name) ||
			appInfoStore.getAppInfo(app.content) ||
			appInfoStore.getAppInfo(app.url);

		return (
			storedInfo?.bgColor || storedInfo?.backgroundColor || faviconCache[app.name]?.bgColor || ''
		);
	}
</script>

{#if !selectedApp}
	<div class="page-holder">
		<div class="page pt-4 px-4 flex flex-col h-screen" class:page-exit={isExiting}>
			<span class="text-6xl font-[300]">apps</span>
			<div class="flex flex-col gap-4 mt-8 flex-1 overflow-y-auto pb-16">
				{#each apps as app}
					{@const iconSrc = getAppIcon(app)}
					{@const bgColor = getAppBgColor(app)}
					<button
						class="flex flex-row gap-4 text-left items-center p-2 hover:bg-opacity-10"
						on:click={() => showAppDetail(app)}
					>
						{#if iconSrc}
							<img
								src={iconSrc}
								alt={`${app.name} icon`}
								class="w-12 h-12 object-contain p-1 {bgColor && !bgColor.startsWith('#')
									? bgColor
									: ''}"
								style={bgColor && bgColor.startsWith('#') ? `background-color: ${bgColor};` : ''}
								on:error={(e) => {
									e.target.style.display = 'none';
									if (e.target.nextElementSibling) {
										e.target.nextElementSibling.style.display = 'flex';
									}
								}}
							/>
							<span
								class="w-12 h-12 justify-center items-center flex {textClass} font-[300] hidden"
								style="background-color: {accentColor};">{app.name.charAt(0).toUpperCase()}</span
							>
						{:else}
							<span
								class="w-12 h-12 justify-center items-center flex {textClass} font-[300]"
								style="background-color: {accentColor};">{app.name.charAt(0).toUpperCase()}</span
							>
						{/if}
						<div class="flex flex-col gap-1 flex-1">
							<span class="text-3xl font-[300]">{app.name}</span>
							<span class="text-sm font-[300] text-[#a1a1a1]">
								installed app
							</span>
						</div>
					</button>
				{/each}
			</div>
		</div>
	</div>
{:else}
	<div class="page-holder">
		<div class="page pt-4 px-4 flex flex-col h-screen" class:page-exit={isExiting}>
			<span class="text-6xl font-[300] lowercase">{selectedApp.name}</span>
			<div class="flex flex-col gap-6 mt-8 flex-1 overflow-y-auto pb-24">
				<div class="flex flex-col gap-2">
					<span class="text-xl font-[300]">app information</span>
					<span class="text-sm font-[300] text-[#a1a1a1]">
						Edit the app information stored in local storage. Changes will be saved immediately.
					</span>
				</div>

				<div class="flex flex-col gap-4">
					{#each defaultAppInfoFields as field}
						{@const inputId = `input-${field}`}
						<div class="flex flex-col gap-2">
							<div class="flex flex-row gap-2 items-center">
								<div class="flex-1">
									<label for={inputId} class="text-[#767676] text-sm block mb-2">
										{field}
									</label>
									<textarea
										id={inputId}
										bind:value={appInfoStrings[field]}
										on:input={(e) => updateProperty(field, e.target.value)}
										class="bg-[#bebebe] w-full py-2 pl-2 outline-none placeholder:text-gray-500 text-[#121212] text-base min-h-[60px] resize-y"
										placeholder="Enter {field}..."
									></textarea>
								</div>
							</div>
						</div>
					{/each}
				</div>
			</div>
		</div>
	</div>

	<div
		class="w-full justify-between flex flex-row fixed bottom-0 right-0 px-4 py-2 gap-8 z-10 bottom-bar"
		class:bottom-bar-exit={isExiting}
		style="background-color: {bottomBarBg};"
	>
		<div class="btn w-full">
			<Button
				text="save"
				onClick={saveAppInfo}
				className="btn !w-full"
				style="background-color: {bottomBarBg};"
			/>
		</div>
		<div class="btn w-full">
			<Button text="back" onClick={showMainPage} className="btn !w-full" style="background-color: {bottomBarBg};"/>
		</div>
	</div>
{/if}

<style>
	.page {
		height: 100%;
		width: 100%;
	}
</style>
