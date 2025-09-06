<script>
	export let title = '';
	export let description = '';
	export let value = false;
	export let className = '';
	export let onToggle = null;

	function handleToggle() {
		value = !value;
		if (onToggle) {
			onToggle(value);
		}
	}
</script>

<div class="flex flex-col gap-2">
	<div class="flex items-center justify-between {className}">
		<div class="flex flex-col w-full">
			<span class="text-sm font-[300] text-[#a1a1a1]">{title}</span>
			<div class="flex items-center gap-2 justify-between w-full">
				<span class="text-white text-2xl mt-1">{value ? 'On' : 'Off'}</span>
				<button
					class="w-16 h-6 border-2 border-white relative transition-colors flex items-center {value
						? 'bg-[#ff00ff]'
						: 'bg-transparent'}"
					on:click={handleToggle}
					on:keydown={(e) => e.key === 'Enter' && handleToggle()}
					role="switch"
					aria-checked={value}
					tabindex="0"
				>
					<div
						class="w-4 h-8 bg-white border-2 border-black transition-transform duration-200 ease-in-out {value
							? 'translate-x-12'
							: 'translate-x-[-2px]'}"
					></div>
				</button>
			</div>
		</div>
	</div>

	{#if description}
		<span class="text-sm font-[400] mt-1 text-[#a1a1a1]">{description}</span>
	{/if}
</div>
