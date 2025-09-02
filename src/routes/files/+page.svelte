<script>
	import { goto } from '$app/navigation';
	import Icon from '@iconify/svelte';
	import { kernel } from '../../kernel/store';
	import BottomControls from '../../components/BottomControls.svelte';
	import { onMount } from 'svelte';

	let currentFolder = 'root';
	// $: currentFolder = $kernel.cursor.join('/');
	let isExiting = false;
	let isExpanded = false;
	let isUnmounting = false;

	// Remove the onMount logic that automatically expands

	function handleToggle(event) {
		isExpanded = event.detail.expanded;
	}

	function addNewFile() {
		goto('/new/file?redirectTo=/files');
	}

	function addNewFolder() {
		goto('/new/dir?redirectTo=/files');
	}

	function closePage() {
		isUnmounting = true;
		setTimeout(() => {
			isExpanded = false;
			setTimeout(() => {
				isExiting = true;
				setTimeout(() => {
					goto('/');
				}, 200); // Match the animation duration
			}, 300); // Allow time for bottom controls to collapse
		}, 300); // Allow time for unmounting animation
	}

    onMount(() => {
        isExpanded = false;
    });
</script>

<!-- <div class="flex flex-row gap-12 px-8">
    <button class={$kernel.isRoot() ? "underline text-[#d1d1d1]" : "underline text-[#f12] p-2"} disabled={$kernel.isRoot()}>Up</button>
    <button class="underline text-[#f12] p-2" on:click={() => goto('/new/file?redirectTo=/files')}>Add New File</button>
    <button class="underline text-[#f12] p-2" on:click={() => goto('/new/dir?redirectTo=/files')}>Add New Folder</button>
</div> -->
<div class="ml-4 h-screen page-holder">
	<div class="flex flex-row mt-2 text-[#ff00ff] items-center gap-1 !h-[3rem] text-base page" class:page-exit={isExiting}>
		<Icon icon="carbon:home" width="22" height="22" />
		<Icon icon="carbon:chevron-right" width="18" height="18" class="text-[#d1d1d1]" />
		<span class="truncate max-w-64" title={currentFolder}>{currentFolder}</span>
		<Icon icon="carbon:chevron-right" width="18" height="18" class="text-[#d1d1d1]" />
	</div>
	<div class="page" class:page-exit={isExiting}>
		<span class="text-6xl !h-[3rem]">files</span>
	</div>
	<div class="mt-8 h-[calc(100vh-10rem)] page" class:page-exit={isExiting}>
		<div class="flex flex-col gap-3 overflow-y-scroll pb-8 h-full">
			{#each $kernel.getParsedFiles() as file}
				<div class="flex flex-row gap-4">
					<span class="w-20 h-20">
						{#if file.type === 'directory'}
							<span
								class=" bg-[#ff00ff] w-full h-full justify-end items-end flex pr-2 pb-2 font-[500]"
								>{Object.keys(file.content).length}</span
							>
						{:else if file.type === 'document'}
							<Icon
								icon="carbon:document"
								width="20"
								height="20"
								class="bg-[#5f5f5f] flex w-full h-full p-2"
							/>
						{:else if file.type === 'image'}
							<Icon
								icon="carbon:image"
								width="20"
								height="20"
								class="bg-[#5f5f5f] flex w-full h-full p-2"
							/>
						{:else if file.type === 'music'}
							<Icon
								icon="carbon:music"
								width="20"
								height="20"
								class="bg-[#5f5f5f] flex w-full h-full p-2"
							/>
						{:else if file.type === 'video'}
							<Icon
								icon="carbon:video"
								width="20"
								height="20"
								class="bg-[#5f5f5f] flex w-full h-full p-2"
							/>
						{:else if file.type === 'app'}
							<Icon
								icon="carbon:application"
								width="20"
								height="20"
								class="bg-[#5f5f5f] flex w-full h-full p-2"
							/>
						{/if}
					</span>
					<div class="flex flex-col min-w-0">
						<span class="truncate max-w-48" title={file.name}>{file.name}</span>
						<span class="text-base text-[#656565]">{file.type}</span>
					</div>
				</div>
			{/each}
		</div>
	</div>
</div>

<BottomControls expanded={isExpanded} unmounting={isUnmounting} on:toggle={handleToggle}>
	<div class="flex flex-row gap-12 w-full justify-center items-center">
		<div class="btn-animate flex flex-col gap-2 justify-center items-center" class:animate={isExpanded}>
			<button on:click={addNewFile} class="flex flex-col border border-white rounded-full !border-2 p-1 font-bold">
				<Icon icon="carbon:document" width="20" height="20" strokeWidth="2"/>
			</button>
			<span class="text-xs font-[400]">file</span>
		</div>
		<!-- <div class="btn-animate flex flex-col gap-2 justify-center items-center" class:animate={isExpanded}>
			<button on:click={addNewFolder} class="flex flex-col border border-white rounded-full !border-2 p-1 font-bold">
				<Icon icon="carbon:folder" width="20" height="20" strokeWidth="2"/>
			</button>
			<span class="text-xs font-[400]">folder</span>
		</div> -->
		<div class="btn-animate flex flex-col gap-2 justify-center items-center" class:animate={isExpanded}>
			<button on:click={closePage} class="flex flex-col border border-white rounded-full !border-2 p-1 font-bold">
				<Icon icon="carbon:close" width="20" height="20" strokeWidth="2"/>
			</button>
			<span class="text-xs font-[400]">close</span>
		</div>
	</div>
</BottomControls>

<style>
	.btn-animate {
		transform: translateY(120%);
		opacity: 0;
	}
	
	.btn-animate.animate {
		animation: button-overshoot 0.5s ease-out forwards;
		opacity: 1;
	}
	
	@keyframes button-overshoot {
		0% {
			transform: translateY(120%);
		}
		70% {
			transform: translateY(-20%);
		}
		100% {
			transform: translateY(0);
		}
	}
</style>