<script>
	import { settingsStore } from '../../store/settings';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { backgroundThemeStore, accentColorStore, borderColorClassStore } from '../../utils/theme';

	$: backgroundTheme = $backgroundThemeStore;
	$: accentColor = $accentColorStore;
	$: borderClass = $borderColorClassStore;

	let lockScreenY = 0;
	let isDragging = false;
	let dragStartY = 0;
	let currentY = 0;
	let enteredPassword = '';
	let storedPassword = '';
	let isUnlocked = false;
	let screenHeight = 800; // Default fallback

	// Physics constants
	const RESISTANCE = 0.3; // Resistance factor (0-1, lower = more resistance)
	const BOUNCE_THRESHOLD = 0.5; // 50% of screen height to unlock
	const BOUNCE_SPRING = 0.15; // Spring constant for bounce animation

	// Get stored password
	onMount(() => {
		if (browser) {
			screenHeight = window.innerHeight;
		}
		
		const password = settingsStore.get('security.password');
		if (password) {
			storedPassword = password;
		} else {
			// No password set, unlock immediately
			isUnlocked = true;
		}
	});

	// Handle touch/mouse start
	function handleStart(event) {
		if (isUnlocked) return;
		
		isDragging = true;
		const clientY = event.touches ? event.touches[0].clientY : event.clientY;
		dragStartY = clientY;
		currentY = lockScreenY;
	}

	// Handle touch/mouse move
	function handleMove(event) {
		if (!isDragging || isUnlocked) return;

		event.preventDefault();
		const clientY = event.touches ? event.touches[0].clientY : event.clientY;
		const deltaY = dragStartY - clientY; // Positive when dragging up
		
		// Apply resistance - harder to drag up (resistance increases as you drag more)
		const dragProgress = Math.abs(deltaY) / screenHeight;
		const resistanceFactor = Math.max(0.1, 1 - dragProgress * RESISTANCE);
		const adjustedDelta = deltaY * resistanceFactor;
		
		// Calculate new position with bounds (lockScreenY increases as we drag up)
		const maxDrag = screenHeight * 0.7;
		const newY = Math.max(0, Math.min(maxDrag, currentY + adjustedDelta));
		lockScreenY = newY;
	}

	// Handle touch/mouse end
	function handleEnd() {
		if (!isDragging || isUnlocked) return;
		
		isDragging = false;
		const dragPercentage = lockScreenY / screenHeight;

		if (dragPercentage >= BOUNCE_THRESHOLD) {
			// Unlock - slide up completely
			lockScreenY = screenHeight;
			setTimeout(() => {
				isUnlocked = true;
			}, 300);
		} else {
			// Bounce back - spring animation
			const targetY = 0;
			const distance = lockScreenY - targetY;
			let currentDistance = distance;
			const springFactor = BOUNCE_SPRING;
			
			function animateBounce() {
				currentDistance *= (1 - springFactor);
				lockScreenY = targetY + currentDistance;
				
				if (Math.abs(currentDistance) > 1) {
					requestAnimationFrame(animateBounce);
				} else {
					lockScreenY = 0;
				}
			}
			
			animateBounce();
		}
	}

	// Handle number key press
	function handleNumberPress(number) {
		if (isUnlocked) return;
		enteredPassword += number;
		
		// Check if password matches
		if (enteredPassword === storedPassword) {
			isUnlocked = true;
			lockScreenY = screenHeight;
			setTimeout(() => {
				goto('/');
			}, 300);
		} else if (enteredPassword.length >= storedPassword.length) {
			// Wrong password, clear and shake
			enteredPassword = '';
			const lockScreen = document.getElementById('lock-screen');
			if (lockScreen) {
				lockScreen.style.animation = 'shake 0.5s';
				setTimeout(() => {
					lockScreen.style.animation = '';
				}, 500);
			}
		}
	}

	// Handle backspace
	function handleBackspace() {
		if (isUnlocked) return;
		enteredPassword = enteredPassword.slice(0, -1);
	}

	// Get password display (show dots for entered digits)
	$: passwordDisplay = '•'.repeat(enteredPassword.length);
</script>

<div class="fixed inset-0 z-50 overflow-hidden" style="background: {backgroundTheme === 'light' ? '#f5f5f5' : '#121212'};">
	<!-- Numeric Keypad (always visible underneath) -->
	<div class="absolute inset-0 bg-[#cab] flex flex-col justify-end pb-8">
		<div class="flex flex-col items-center justify-center mb-8">
			<span class="text-2xl font-[300] mb-2" style="color: {backgroundTheme === 'light' ? '#121212' : '#ffffff'};">enter your password</span>
			<div class="flex gap-2 mb-8">
				{#each Array(4) as _, i}
					<div
						class="w-3 h-3 rounded-full border-2 {borderClass}"
						style="background: {enteredPassword.length > i ? accentColor : 'transparent'};"
					></div>
				{/each}
			</div>
		</div>
		
		<!-- Keypad Grid -->
		<div class="grid grid-cols-3 gap-4 px-8 max-w-sm mx-auto">
			{#each [1, 2, 3, 4, 5, 6, 7, 8, 9] as num}
				<button
					class="aspect-square flex items-center justify-center text-3xl font-[300] border-2 {borderClass} rounded-lg active:opacity-50 transition-opacity"
					style="color: {backgroundTheme === 'light' ? '#121212' : '#ffffff'};"
					on:click={() => handleNumberPress(num)}
					on:touchstart|preventDefault={() => handleNumberPress(num)}
				>
					{num}
				</button>
			{/each}
			
			<!-- Empty space, 0, backspace -->
			<div></div>
			<button
				class="aspect-square flex items-center justify-center text-3xl font-[300] border-2 {borderClass} rounded-lg active:opacity-50 transition-opacity"
				style="color: {backgroundTheme === 'light' ? '#121212' : '#ffffff'};"
				on:click={() => handleNumberPress(0)}
				on:touchstart|preventDefault={() => handleNumberPress(0)}
			>
				0
			</button>
			<button
				class="aspect-square flex items-center justify-center border-2 {borderClass} rounded-lg active:opacity-50 transition-opacity"
				style="color: {backgroundTheme === 'light' ? '#121212' : '#ffffff'};"
				on:click={handleBackspace}
				on:touchstart|preventDefault={handleBackspace}
			>
				<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/>
					<path d="M18 9l-6 6M12 9l6 6"/>
				</svg>
			</button>
		</div>
		
		<!-- Emergency Call Button -->
		<button
			class="mt-8 px-6 py-3 border-2 {borderClass} rounded-lg text-base font-[300] mx-auto"
			style="color: {backgroundTheme === 'light' ? '#121212' : '#ffffff'};"
		>
			emergency call
		</button>
	</div>

	<!-- Lock Screen Overlay (slides up) -->
	{#if !isUnlocked}
		<div
			id="lock-screen"
			class="absolute inset-0 bg-[#cab] flex flex-col items-center justify-center transition-transform duration-300 ease-out"
			style="transform: translateY({lockScreenY}px); touch-action: none;"
			on:touchstart={handleStart}
			on:touchmove={handleMove}
			on:touchend={handleEnd}
			on:mousedown={handleStart}
			on:mousemove={handleMove}
			on:mouseup={handleEnd}
			on:mouseleave={handleEnd}
		>
			<!-- Drag indicator -->
			<div class="absolute top-8 w-12 h-1 rounded-full opacity-50 bg-[#121212]"></div>
			
			<!-- Time display (placeholder) -->
			<div class="flex flex-col items-center mt-32">
				<span class="text-7xl font-[300] mb-2 text-[#121212]">02:58</span>
				<span class="text-xl font-[300] text-[#121212]">Saturday, 27 October</span>
			</div>
		</div>
	{/if}
</div>

<style>
	@keyframes shake {
		0%, 100% { transform: translateX(0); }
		25% { transform: translateX(-10px); }
		75% { transform: translateX(10px); }
	}
</style>

