<script>
	import {
		accentColorStore,
		textColorClassStore,
		backgroundThemeStore
	} from '../../../utils/theme';
	import { settingsStore } from '../../../store/settings';
	import Select from '../../../components/Select.svelte';
	import ColorPicker from '../../../components/ColorPicker.svelte';
	import Switch from '../../../components/Switch.svelte';
	import Input from '../../../components/Input.svelte';
	import { onMount, getContext } from 'svelte';
	import { slide } from 'svelte/transition';

	$: accentColor = $accentColorStore;
	$: textClass = $textColorClassStore;
	$: background = $backgroundThemeStore;

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
		{ name: 'azure', hex: '#007fff' }
	];

	// Background type options
	const backgroundTypes = [
		{ value: 'solid', label: 'Solid Color' },
		{ value: 'image', label: 'Background Image' },
		{ value: 'custom', label: 'Custom Background' },
		{ value: 'bing', label: 'Bing Wallpaper' }
	];

	// Background type labels for Select component
	const backgroundTypeLabels = backgroundTypes.map((type) => type.label);

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

	// Security settings state
	let autoLock = true;
	let requirePassword = false;
	let password = '';

	// Lock screen settings state
	let backgroundType = 'solid';
	let lockScreenBackgroundColor = '#dc143c';
	let lockScreenColorName = 'crimson';
	let colorPickerOpen = false;
	let customBackgroundImage = '';
	let selectedImagePreview = '';
	let selectedImageId = null;
	let showImagePicker = false;

	// Sample background images - same as in settings
	const backgroundImages = [
		{
			id: 1,
			url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
			name: 'Mountain Landscape'
		},
		{
			id: 2,
			url: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800',
			name: 'Ocean Waves'
		},
		{
			id: 3,
			url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800',
			name: 'Forest Path'
		},
		{
			id: 4,
			url: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800',
			name: 'City Skyline'
		},
		{
			id: 5,
			url: 'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=800',
			name: 'Desert Dunes'
		},
		{
			id: 6,
			url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
			name: 'Tropical Beach'
		},
		{
			id: 7,
			url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800',
			name: 'Mountain Lake'
		},
		{
			id: 8,
			url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800',
			name: 'Forest Trail'
		},
		{
			id: 9,
			url: 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=800',
			name: 'Sunset Horizon'
		},
		{
			id: 10,
			url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800',
			name: 'Misty Mountains'
		},
		{
			id: 11,
			url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
			name: 'Alpine Valley'
		},
		{
			id: 12,
			url: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800',
			name: 'Coastal Cliffs'
		}
	];

	// Get hideBottomBar function from context
	const hideBottomBar = getContext('hideBottomBar');

	// Hide/show bottom bar when color picker opens/closes
	let lastColorPickerState = false;
	$: if (hideBottomBar && colorPickerOpen !== lastColorPickerState) {
		lastColorPickerState = colorPickerOpen;
		hideBottomBar(colorPickerOpen);
	}

	// Get initial values from store
	onMount(() => {
		// Security settings
		const storedAutoLock = settingsStore.get('security.autoLock');
		if (storedAutoLock !== undefined) {
			autoLock = storedAutoLock;
		}

		const storedRequirePassword = settingsStore.get('security.requirePassword');
		if (storedRequirePassword !== undefined) {
			requirePassword = storedRequirePassword;
		}

		const storedPassword = settingsStore.get('security.password');
		if (storedPassword !== undefined) {
			password = storedPassword;
		}

		// Lock screen settings
		const bgType = settingsStore.get('lockScreen.backgroundType');
		if (bgType !== undefined) {
			backgroundType = bgType;
			const label = backgroundTypes.find((type) => type.value === bgType)?.label;
			if (label) {
				currentBackgroundTypeLabel = label;
			}
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

		const storedImageId = settingsStore.get('lockScreen.selectedImageId');
		if (storedImageId !== undefined) {
			selectedImageId = storedImageId;
		}
	});

	// Current background type label for Select component
	let currentBackgroundTypeLabel = 'Solid Color';

	// Update currentBackgroundTypeLabel when backgroundType changes
	$: {
		const label = backgroundTypes.find((type) => type.value === backgroundType)?.label;
		if (label) {
			currentBackgroundTypeLabel = label;
		}
	}

	// Handle auto-lock toggle
	function handleAutoLockToggle(value) {
		autoLock = value;
		settingsStore.set('security.autoLock', value);
	}

	// Handle require password toggle
	function handleRequirePasswordToggle(value) {
		requirePassword = value;
		settingsStore.set('security.requirePassword', value);
		if (!value) {
			// Clear password when disabling
			password = '';
			settingsStore.set('security.password', '');
		}
	}

	// Filter password to numbers only
	function handlePasswordInput(event) {
		const value = event.target.value;
		// Remove all non-numeric characters
		const numericOnly = value.replace(/\D/g, '');
		password = numericOnly;
		event.target.value = numericOnly;
	}

	// Save password when it changes
	$: if (password !== undefined && requirePassword) {
		settingsStore.set('security.password', password);
	}

	// Handle background type change
	function handleBackgroundTypeChange(selectedLabel) {
		const selectedType = backgroundTypes.find((type) => type.label === selectedLabel);
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

	// Handle image selection
	function handleImageSelect(imageId, imageUrl) {
		selectedImageId = imageId;
		selectedImagePreview = imageUrl;
		settingsStore.set('lockScreen.selectedImageId', imageId);
		settingsStore.set('lockScreen.selectedImageUrl', imageUrl);
		settingsStore.set('lockScreen.backgroundType', 'image');
		backgroundType = 'image';
		currentBackgroundTypeLabel = 'Background Image';
		showImagePicker = false; // Close picker after selection
	}

	// Toggle image picker
	function toggleImagePicker() {
		showImagePicker = !showImagePicker;
	}
</script>

<div class="flex flex-col items-start justify-start w-full min-h-[calc(100vh-2rem)] p-4">
	<span class="text-lg text-left w-full font-semibold {textClass} flex-shrink-0">LOCKSCREEN SETUP</span>

	<p class="text-lg {textClass} flex-shrink-0">Configure your lock screen security and appearance settings.</p>

	<div class="flex flex-col gap-4 w-full flex-1 min-h-0 mb-24">
		<!-- Security Settings -->
		<div class="flex flex-col w-full mt-2">
			<span class="text-lg font-[400]" style="color: {accentColor};">security</span>

			<Switch
				title="Auto-lock"
				description="Lock Ubiquity whenever app is out of focus."
				value={autoLock}
				onToggle={handleAutoLockToggle}
				className="mt-4"
			/>

			<Switch
				title="Require Password"
				description="Require a password to unlock your device."
				value={requirePassword}
				onToggle={handleRequirePasswordToggle}
				className="mt-4"
			/>

			{#if requirePassword}
				<div class="flex flex-col gap-2 mt-2" transition:slide={{ duration: 300, axis: 'y' }}>
					<label for="password-input" class="text-[#767676] text-sm font-[400]">Password</label>
					<input
						id="password-input"
						type="password"
						value={password}
						on:input={handlePasswordInput}
						class="bg-[#bebebe] w-full py-2 pl-2 outline-none text-[#121212] text-base"
						inputmode="numeric"
						pattern="[0-9]*"
						placeholder="Enter numeric password"
					/>
					<span class="text-sm font-[300] text-[#a1a1a1]">
						Enter a numeric password to protect your device.
					</span>
				</div>
			{/if}
		</div>

		<!-- Lock Screen Background -->
		<div class="flex flex-col w-full mt-6 pb-8">
			<span class="text-lg font-[400]" style="color: {accentColor};">background</span>

			<Select
				label="Background Type"
				data={backgroundTypeLabels}
				bind:selection={currentBackgroundTypeLabel}
				onSelectionChange={handleBackgroundTypeChange}
				className="mt-4"
			/>

			{#if backgroundType === 'solid'}
				<div
					class="flex flex-col gap-2 font-[400] mt-4"
					transition:slide={{ duration: 300, axis: 'y' }}
				>
					<label for="lock-bg-color" class="text-[#767676] text-sm">Background Color</label>
					<!-- svelte-ignore a11y-click-events-have-key-events -->
					<!-- svelte-ignore a11y-no-static-element-interactions -->
					<div
						class="flex flex-row gap-2 border-2 border-white p-1 pl-2 justify-start items-center transition-opacity cursor-pointer"
						on:click={() => (colorPickerOpen = true)}
						role="button"
						tabindex="0"
						on:keydown={(e) => {
							if (e.key === 'Enter' || e.key === ' ') {
								e.preventDefault();
								colorPickerOpen = true;
							}
						}}
					>
						<div class="w-4 h-4" style="background-color: {lockScreenBackgroundColor};"></div>
						<span class="text-base font-[300]">{lockScreenColorName}</span>
					</div>
					<ColorPicker
						colors={lockScreenColors}
						bind:open={colorPickerOpen}
						on:colorSelected={handleColorSelected}
						className="p-4"
					/>
				</div>
			{:else if backgroundType === 'image'}
				<div class="flex gap-4 mt-4" transition:slide={{ duration: 300, axis: 'y' }}>
					<!-- Preview area -->
					<div
						class="w-32 h-32 bg-[#414141] flex-shrink-0"
						style={selectedImagePreview
							? `background-image: url(${selectedImagePreview}); background-size: cover; background-position: center;`
							: ''}
					></div>

					<!-- Controls -->
					<div class="flex flex-col gap-4 flex-1">
						<span class="text-sm font-[400] text-[#767676]">Start background</span>
						<button
							on:click={toggleImagePicker}
							class="border-2 border-white w-fit py-2 px-4 outline-none text-base text-center"
						>
							choose photo
						</button>
					</div>
				</div>
				{#if showImagePicker}
					<div class="flex flex-col gap-4 mt-4" transition:slide={{ duration: 300, axis: 'y' }}>
						<div class="grid grid-cols-3 gap-4">
							{#each backgroundImages as image}
								<button
									on:click={() => handleImageSelect(image.id, image.url)}
									class="relative aspect-square rounded-none overflow-hidden border-2 {selectedImageId ===
									image.id
										? 'border-white'
										: 'border-transparent'}"
									style="border-color: {selectedImageId === image.id
										? accentColor
										: 'transparent'};"
								>
									<img src={image.url} alt={image.name} class="w-full h-full object-cover" />
								</button>
							{/each}
						</div>
					</div>
				{/if}
			{:else if backgroundType === 'custom'}
				<div
					class="flex flex-col gap-2 font-[400] mt-4"
					transition:slide={{ duration: 300, axis: 'y' }}
				>
					<label for="lock-bg-image" class="text-[#767676] text-sm"
						>Custom Background Image URL</label
					>
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
				<div
					class="flex flex-col gap-2 font-[400] mt-4"
					transition:slide={{ duration: 300, axis: 'y' }}
				>
					<span class="text-sm font-[300] text-[#a1a1a1]">
						Bing daily wallpaper will be used as your lock screen background.
					</span>
				</div>
			{/if}
		</div>
	</div>
</div>
