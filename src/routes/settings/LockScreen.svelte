<script>
	import { settingsStore } from '../../store/settings';
	import { accentColorStore, borderColorClassStore } from '../../utils/theme';
	import ColorPicker from '../../components/ColorPicker.svelte';
	import Select from '../../components/Select.svelte';
	import { slide } from 'svelte/transition';
	import { goto } from '$app/navigation';

	export let isExiting = false;

	$: accentColor = $accentColorStore;
	$: borderClass = $borderColorClassStore;

	// Lock screen background color options
	const lockScreenColors = [
		{ name: 'crimson', hex: '#dc143c' },
		{ name: 'red', hex: '#E51400' },
		{ name: 'orange', hex: '#FA6800' },
		{ name: 'amber', hex: '#F0A30A' },
		{ name: 'yellow', hex: '#E3C800' },
		{ name: 'lime', hex: '#A4C400' },
		{ name: 'green', hex: '#60A917' },
		{ name: 'emerald', hex: '#008A00' },
		{ name: 'teal', hex: '#00ABA9' },
		{ name: 'cyan', hex: '#1BA1E2' },
		{ name: 'cobalt', hex: '#0050EF' },
		{ name: 'indigo', hex: '#6A00FF' },
		{ name: 'violet', hex: '#AA00FF' },
		{ name: 'pink', hex: '#F472D0' },
		{ name: 'magenta', hex: '#D80073' },
		{ name: 'brown', hex: '#825A2C' },
		{ name: 'olive', hex: '#6D8764' },
		{ name: 'steel', hex: '#647687' },
		{ name: 'mauve', hex: '#76608A' },
		{ name: 'black', hex: '#000000' },
		{ name: 'dark gray', hex: '#1f1f1f' },
        { name: 'turquoise', hex: '#00c9b3' },
        { name: 'aqua', hex: '#00e5ff' },
        { name: 'azure', hex: '#007fff' },
	];

	// Background type options
	const backgroundTypes = [
		{ value: 'solid', label: 'Solid Color' },
		{ value: 'image', label: 'Background Image' },
		{ value: 'custom', label: 'Custom Background' },
		{ value: 'bing', label: 'Bing Wallpaper' }
	];

	// Background type labels for Select component
	const backgroundTypeLabels = backgroundTypes.map(type => type.label);

	// Get color name from hex value
	function getColorName(hex) {
		const color = lockScreenColors.find((c) => c.hex.toLowerCase() === hex.toLowerCase());
		return color ? color.name : 'crimson';
	}

	// Get hex from color name
	function getColorHex(name) {
		const color = lockScreenColors.find((c) => c.name === name);
		return color ? color.hex : '#dc143c';
	}

	// Lock screen settings state
	let backgroundType = 'solid';
	let lockScreenBackgroundColor = '#dc143c'; // Default red
	let lockScreenColorName = 'crimson';
	let colorPickerOpen = false;
	let customBackgroundImage = '';
	let selectedImagePreview = '';

	// Load settings from store
	$: {
		const bgType = settingsStore.get('lockScreen.backgroundType');
		if (bgType !== undefined) {
			backgroundType = bgType;
		}

		const bgColor = settingsStore.get('lockScreen.backgroundColor');
		if (bgColor !== undefined) {
			lockScreenBackgroundColor = bgColor;
			lockScreenColorName = getColorName(bgColor);
		}

		const bgImage = settingsStore.get('lockScreen.backgroundImage');
		if (bgImage !== undefined) {
			customBackgroundImage = bgImage;
		}

		const selectedImage = settingsStore.get('lockScreen.selectedImageUrl');
		if (selectedImage !== undefined) {
			selectedImagePreview = selectedImage;
		}
	}

	// Get current background type label
	$: currentBackgroundTypeLabel = backgroundTypes.find(type => type.value === backgroundType)?.label || 'Solid Color';

	// Handle background type change
	function handleBackgroundTypeChange(selectedLabel) {
		const selectedType = backgroundTypes.find(type => type.label === selectedLabel);
		if (selectedType) {
			backgroundType = selectedType.value;
			settingsStore.set('lockScreen.backgroundType', backgroundType);
		}
	}

	// Handle background color change
	function handleAccentColorChange(colorName) {
		const hex = getColorHex(colorName);
		lockScreenBackgroundColor = hex;
		lockScreenColorName = colorName;
		settingsStore.set('lockScreen.backgroundColor', hex);
	}

	// Handle color selection from ColorPicker
	function handleColorSelected(event) {
		const color = event.detail;
		handleAccentColorChange(color.name);
		colorPickerOpen = false;
	}

	// Handle background image input
	function handleBackgroundImageInput(event) {
		const value = event.target.value;
		customBackgroundImage = value;
		settingsStore.set('lockScreen.backgroundImage', value);
	}

	// Navigate to background images page
	function openBackgroundImages() {
		goto('/settings/lock-screen/images');
	}
</script>

<div class="page-holder">
	<div class="page pt-4 flex flex-col h-screen" class:page-exit={isExiting}>
		<span class="text-6xl font-[300] px-4">lock screen</span>
		<div class="flex flex-col gap-8 mt-8 flex-1 overflow-y-auto pb-24 px-4">
            <p class="text-base font-[300]">
                Customize your lock screen background.
            </p>
			<div class="flex flex-col">
				<span class="text-xl font-[300]" style="color: {accentColor};">background</span>
				
				<div class="flex flex-col mt-4">
					<Select
						label="Background Type"
						data={backgroundTypeLabels}
						selection={currentBackgroundTypeLabel}
						onSelectionChange={handleBackgroundTypeChange}
					/>

					{#if backgroundType === 'solid'}
						<div class="flex flex-col gap-2 font-[400] mt-6" transition:slide={{ duration: 300, axis: 'y' }}>
							<label for="lock-bg-color" class="text-[#767676] text-sm">Background Color</label>
							<button
								id="lock-bg-color"
								on:click={() => colorPickerOpen = true}
								class="border-2 {borderClass} w-full py-2 pl-2 outline-none text-base text-left flex items-center gap-2"
							>
								<div 
									class="w-6 h-6"
									style="background-color: {lockScreenBackgroundColor};"
								></div>
								<span>{lockScreenColorName}</span>
							</button>
							<ColorPicker
								colors={lockScreenColors}
								open={colorPickerOpen}
								on:colorSelected={handleColorSelected}
								className="p-4"
							/>
						</div>
					{:else if backgroundType === 'image'}
						<div class="flex gap-4 mt-8" transition:slide={{ duration: 300, axis: 'y' }}>
							<!-- Preview area -->
							<div 
								class="w-32 h-32 bg-[#414141] flex-shrink-0"
								style={selectedImagePreview ? `background-image: url(${selectedImagePreview}); background-size: cover; background-position: center;` : ''}
							></div>
							
							<!-- Controls -->
							<div class="flex flex-col gap-4 flex-1">
								<span class="text-sm font-[400] text-[#767676]">Start background</span>
								<button
									on:click={openBackgroundImages}
									class="border-2 {borderClass} w-fit py-2 px-4 outline-none text-base text-center"
								>
									choose photo
								</button>
							</div>
						</div>
					{:else if backgroundType === 'custom'}
						<div class="flex flex-col gap-2 font-[400] mt-6" transition:slide={{ duration: 300, axis: 'y' }}>
							<label for="lock-bg-image" class="text-[#767676] text-sm">Custom Background Image URL</label>
							<input
								id="lock-bg-image"
								type="text"
								value={customBackgroundImage}
								on:input={handleBackgroundImageInput}
								class="bg-[#bebebe] w-full py-2 pl-2 outline-none text-[#121212] text-base"
								placeholder="https://example.com/image.jpg"
							/>
							<span class="text-sm font-[300] text-[#a1a1a1]">
								Enter a URL to use a custom background image.
							</span>
						</div>
					{:else if backgroundType === 'bing'}
						<div class="flex flex-col gap-2 font-[400] mt-4" transition:slide={{ duration: 300, axis: 'y' }}>
							<span class="text-sm font-[300] text-[#a1a1a1]">
								Bing daily wallpaper will be used as your lock screen background.
							</span>
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
</div>
