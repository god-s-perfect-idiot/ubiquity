<script>
	import { accentColorStore, textColorClassStore } from '../../../utils/theme';
	import { addToast } from '../../../store/toast';
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import Button from '../../../components/Button.svelte';

	$: accentColor = $accentColorStore;
	$: textClass = $textColorClassStore;

	let imgbbApiKey = '';
	let isImgbbConfigured = false;

	onMount(() => {
		loadImgbbSettings();
	});

	const loadImgbbSettings = () => {
		if (!browser) return;
		imgbbApiKey = localStorage.getItem('imgbb_api_key') || '';
		isImgbbConfigured = !!imgbbApiKey;
	};

	const saveImgbbSettings = () => {
		if (!browser) return;
		localStorage.setItem('imgbb_api_key', imgbbApiKey);
		isImgbbConfigured = !!imgbbApiKey;
		addToast('ImgBB API key saved successfully.');
	};

	const clearImgbbSettings = () => {
		if (!browser) return;
		localStorage.removeItem('imgbb_api_key');
		imgbbApiKey = '';
		isImgbbConfigured = false;
		addToast('ImgBB API key cleared.');
	};
</script>

<div class="flex flex-col gap-4 items-start justify-start w-full h-full p-4">
	<span class="text-lg text-left w-full font-semibold {textClass}">IMGBB SETUP</span>

	<p class="text-lg {textClass}">
		ImgBB is a free image hosting service used to store photos captured by the camera app.
	</p>

	<!-- Setup Instructions -->
	<div class="flex flex-col gap-4 w-full">
		<span class="text-sm font-[300] text-[#a1a1a1]">
			Get your free API key from
			<a
				href="https://api.imgbb.com/"
				target="_blank"
				rel="noopener noreferrer"
				class="text-blue-400 underline">api.imgbb.com</a
			>.
		</span>
		<ol
			class="list-decimal list-inside text-sm font-[300] text-[#a1a1a1] flex flex-col gap-2"
		>
			<li>
				Visit <a
					href="https://api.imgbb.com/"
					target="_blank"
					rel="noopener noreferrer"
					class="text-blue-400 underline">api.imgbb.com</a
				>
			</li>
			<li>Sign up for a free account</li>
			<li>Navigate to your account settings</li>
			<li>Copy your API key</li>
			<li>Paste it in the field below</li>
		</ol>
	</div>

	<!-- API Key Input -->
	<div class="flex flex-col gap-4 w-full">
		<div class="flex flex-col gap-2 font-[400]">
			<label for="imgbb-api-key" class="text-[#767676] text-sm">API Key</label>
			<input
				id="imgbb-api-key"
				type="password"
				bind:value={imgbbApiKey}
				class="bg-[#bebebe] w-full py-2 pl-2 outline-none text-[#121212] text-base"
			/>
		</div>
		<div class="flex flex-row gap-2">
			<Button text="save" onClick={saveImgbbSettings} />
			{#if isImgbbConfigured}
				<Button text="clear" onClick={clearImgbbSettings} />
			{/if}
		</div>
	</div>

	<!-- Status -->
	<div class="flex flex-col gap-2 w-full mt-6">
		{#if isImgbbConfigured}
			<span class="text-xl font-[300]">ImgBB is configured.</span>
		{:else}
			<span class="text-xl font-[300]">ImgBB is not configured.</span>
		{/if}
	</div>
</div>

