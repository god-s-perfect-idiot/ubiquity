<script>
	import { settingsStore } from '../../store/settings';
	import { accentColorStore, borderColorClassStore } from '../../utils/theme';
	import Switch from '../../components/Switch.svelte';
	import Input from '../../components/Input.svelte';
	import { slide } from 'svelte/transition';

	export let isExiting = false;

	$: accentColor = $accentColorStore;
	$: borderClass = $borderColorClassStore;

	// Security settings state
	let autoLock = true;
	let requirePassword = false;
	let encryption = true;
	let password = '';

	// Load settings from store
	$: {
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

		const storedEncryption = settingsStore.get('security.encryption');
		if (storedEncryption !== undefined) {
			encryption = storedEncryption;
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

	// Handle encryption toggle
	function handleEncryptionToggle(value) {
		encryption = value;
		settingsStore.set('security.encryption', value);
	}
</script>

<div class="page-holder">
	<div class="page pt-4 flex flex-col h-screen" class:page-exit={isExiting}>
		<span class="text-6xl font-[300] px-4">security</span>
		<div class="flex flex-col gap-8 mt-8 flex-1 overflow-y-auto pb-24 px-4">
            <p class="text-base font-[300]">
                Configure security settings to protect your device and data.
            </p>
			<div class="flex flex-col">
				<span class="text-xl font-[300]" style="color: {accentColor};">device security</span>
				<Switch
					title="Auto-lock"
					description="Lock Ubiquity whenever app is out of focus."
					bind:value={autoLock}
					onToggle={handleAutoLockToggle}
                    className="mt-4"
				/>
				
				<Switch
					title="Require Password"
					description="Require a password to make changes to security settings."
					bind:value={requirePassword}
					onToggle={handleRequirePasswordToggle}
                    className="mt-4"
				/>
				{#if requirePassword}
					<div class="flex flex-col gap-4 mt-4" transition:slide={{ duration: 300, axis: 'y' }}>
						<div class="flex flex-col gap-2 font-[400]">
							<label for="password-input" class="text-[#767676] text-sm">Password</label>
							<input
								id="password-input"
								type="password"
								value={password}
								on:input={handlePasswordInput}
								class="bg-[#bebebe] w-full py-2 pl-2 outline-none text-[#121212] text-base"
								inputmode="numeric"
								pattern="[0-9]*"
							/>
						</div>
						<span class="text-sm font-[300] text-[#a1a1a1]">
							Enter a numeric password to protect your security settings.
						</span>
					</div>
				{/if}
			</div>
			<div class="flex flex-col gap-4">
				<span class="text-xl font-[300]" style="color: {accentColor};">data encryption</span>
				<Switch
					title="Data Encryption"
					description="Encrypt sensitive data stored on your device."
					bind:value={encryption}
					onToggle={handleEncryptionToggle}
				/>
			</div>
		</div>
	</div>
</div>
