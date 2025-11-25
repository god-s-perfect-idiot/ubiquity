<script>
	export let isExiting = false;
	export let hideBottomBar = () => {};
	import { settingsStore } from '../../store/settings';
	import { accentColorStore, backgroundThemeStore, borderColorClassStore } from '../../utils/theme';
	import Select from '../../components/Select.svelte';
	import ColorPicker from '../../components/ColorPicker.svelte';
	import Switch from '../../components/Switch.svelte';
	import { slide } from 'svelte/transition';

	// Color definitions with hex values
	const accentColors = [
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
		{ name: 'crimson', hex: '#A20025' },
		{ name: 'red', hex: '#E51400' },
		{ name: 'orange', hex: '#FA6800' },
		{ name: 'amber', hex: '#F0A30A' },
		{ name: 'yellow', hex: '#E3C800' },
		{ name: 'brown', hex: '#825A2C' },
		{ name: 'olive', hex: '#6D8764' },
		{ name: 'steel', hex: '#647687' },
		{ name: 'mauve', hex: '#76608A' },
		{ name: 'fuschia', hex: '#ff00ff' }
	];

	// Background options
	const backgroundOptions = ['dark', 'light'];

	// Get color name from hex value
	function getColorName(hex) {
		const color = accentColors.find((c) => c.hex.toLowerCase() === hex.toLowerCase());
		return color ? color.name : 'Fuschia';
	}

	// Get hex from color name
	function getColorHex(name) {
		const color = accentColors.find((c) => c.name === name);
		return color ? color.hex : '#ff00ff';
	}

	// Reactive values from settings store
	let background = 'dark';
	let accentColorName = 'Fuschia';
	let colorPickerOpen = false;
	let showHomescreenWhenOpened = false;
	
	// Get accent color reactively from store
	$: accentColor = $accentColorStore;
	$: borderClass = $borderColorClassStore;
	$: background = $backgroundThemeStore;
	
	// Initialize showHomescreenWhenOpened from settings
	$: {
		const setting = settingsStore.get('appearance.showHomescreenWhenOpened');
		if (setting !== undefined) {
			showHomescreenWhenOpened = setting;
		}
	}

	// Hide bottom bar when color picker opens
	$: if (colorPickerOpen) {
		hideBottomBar(true);
	} else {
		hideBottomBar(false);
	}

	// Update accent color name reactively
	$: {
		accentColorName = getColorName($accentColorStore);
	}

	// Handle background change
	function handleBackgroundChange(value) {
		settingsStore.set('appearance.background', value);
		background = value;
	}

	// Handle accent color change
	function handleAccentColorChange(colorName) {
		const hex = getColorHex(colorName);
		settingsStore.set('appearance.accentColor', hex);
		accentColorName = colorName;
	}

	// Handle color selection from ColorPicker
	function handleColorSelected(event) {
		const color = event.detail;
		handleAccentColorChange(color.name);
		colorPickerOpen = false;
	}

	// Handle show homescreen when opened toggle
	function handleShowHomescreenToggle(value) {
		settingsStore.set('appearance.showHomescreenWhenOpened', value);
		showHomescreenWhenOpened = value;
	}
</script>

<div class="page-holder">
	<div class="page pt-4 px-4 flex flex-col h-screen" class:page-exit={isExiting}>
		<span class="text-6xl font-[300] truncate">start + theme</span>
		<p class="text-base font-[300] mt-8">
			Change your phone's background and <span style="color: {accentColor}">accent color</span> to match your
			mood today, this week or all month.
		</p>
		{#if background === 'light'}
			<div class="mt-6" transition:slide={{ duration: 300, axis: 'y' }}>
				<p class="text-base font-[400]" style="color: {accentColor};">
					Light mode is still in beta. Expect some UI elements to be buggy.
				</p>
			</div>
		{/if}
		<div class="flex flex-col gap-6 mt-8 flex-1 overflow-y-auto">
			<Select
				label="Background"
				data={backgroundOptions}
				bind:selection={background}
				onSelectionChange={handleBackgroundChange}
			/>
			<!-- <Select
				label="Accent Color"
				data={accentColors.map(c => c.name)}
				bind:selection={accentColorName}
				onSelectionChange={handleAccentColorChange}
			/> -->
			<div class="flex flex-col gap-2">
				<span class="text-sm font-[400] text-[#767676]">Accent color</span>
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<!-- svelte-ignore a11y-no-static-element-interactions -->
							<div
								class="flex flex-row gap-2 border-2 {borderClass} p-1 pl-2 justify-start items-center transition-opacity"
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
					<div
						class="w-4 h-4"
						style="background-color: {getColorHex(accentColorName)};"
					></div>
					<span class="text-base font-[300]">{accentColorName}</span>
				</div>
			</div>
			<ColorPicker
				colors={accentColors}
				bind:open={colorPickerOpen}
				on:colorSelected={handleColorSelected}
			/>
			<Switch
				title="Show Homescreen when opened"
				value={showHomescreenWhenOpened}
				onToggle={handleShowHomescreenToggle}
				description="Show the homescreen when opened."
			/>
		</div>
	</div>
</div>
