<script>
	import { accentColorStore, textColorClassStore, backgroundThemeStore } from '../../../utils/theme';
	import { settingsStore } from '../../../store/settings';
	import Select from '../../../components/Select.svelte';
	import ColorPicker from '../../../components/ColorPicker.svelte';
	import { onMount, getContext } from 'svelte';

	$: accentColor = $accentColorStore;
	$: textClass = $textColorClassStore;
	$: background = $backgroundThemeStore;

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

	// Font options
	const fontOptions = ['Noto Sans', 'selawik', 'selawik light'];

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

	let background = 'dark';
	let accentColorName = 'Fuschia';
	let colorPickerOpen = false;
	let selectedFont = 'Noto Sans';

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
		background = settingsStore.get('appearance.background') || 'dark';
		const accentHex = settingsStore.get('appearance.accentColor') || '#ff00ff';
		accentColorName = getColorName(accentHex);
		selectedFont = settingsStore.get('appearance.font') || 'Noto Sans';
	});

	// Handle background change
	function handleBackgroundChange(bg) {
		background = bg;
		settingsStore.set('appearance.background', bg);
	}

	// Handle font change
	function handleFontChange(font) {
		selectedFont = font;
		settingsStore.set('appearance.font', font);
		if (typeof document !== 'undefined') {
			document.body.style.fontFamily = font;
		}
	}

	// Handle color selection
	function handleColorSelected(event) {
		const selectedColor = event.detail;
		accentColorName = selectedColor.name;
		settingsStore.set('appearance.accentColor', selectedColor.hex);
		colorPickerOpen = false;
	}
</script>

<div class="flex flex-col gap-4 items-start justify-start w-full h-full">
	<span class="text-lg text-left w-full font-semibold {textClass}">DISPLAY SETUP</span>

	<p class="text-lg {textClass}">
		Customize your device's appearance with theme, accent color, and font settings.
	</p>

	<!-- Background Theme -->
	<div class="flex flex-col gap-4 w-full">
		<Select
			label="Background"
			data={backgroundOptions}
			bind:selection={background}
			onSelectionChange={handleBackgroundChange}
		/>
		{#if background === 'light'}
			<span class="text-sm font-[300] text-[#a1a1a1]">
				Light mode is still in beta. Expect some UI elements to be buggy.
			</span>
		{/if}
	</div>

	<!-- Accent Color -->
	<div class="flex flex-col gap-4 w-full">
		<div class="flex flex-col gap-2">
			<span class="text-sm font-[400] text-[#767676]">Accent color</span>
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
	</div>

	<!-- Font Selection -->
	<div class="flex flex-col gap-4 w-full">
		<Select
			label="Font"
			data={fontOptions}
			bind:selection={selectedFont}
			onSelectionChange={handleFontChange}
		/>
	</div>
</div>

