<script>
	import { goto } from '$app/navigation';
	import Icon from '@iconify/svelte';
	import { kernel } from '../../kernel/store';
	function addNewFile() {
		kernel.addFile('newFile.txt', 'Hello, World!', 'document');
		kernel.updateFS();
	}
	let currentFolder = 'root';
	// $: currentFolder = $kernel.cursor.join('/');
	console.log(currentFolder);
</script>

<!-- <div class="flex flex-row gap-12 px-8">
    <button class={$kernel.isRoot() ? "underline text-[#d1d1d1]" : "underline text-[#f12] p-2"} disabled={$kernel.isRoot()}>Up</button>
    <button class="underline text-[#f12] p-2" on:click={() => goto('/new/file?redirectTo=/files')}>Add New File</button>
    <button class="underline text-[#f12] p-2" on:click={() => goto('/new/dir?redirectTo=/files')}>Add New Folder</button>
</div> -->
<div class="ml-4">
	<div class="flex flex-row mt-2 text-[#ff00ff] items-center gap-1 h-12 text-base">
		<Icon icon="carbon:home" width="22" height="22" />
		<Icon icon="carbon:chevron-right" width="18" height="18" class="text-[#d1d1d1]" />
		<span>{currentFolder}</span>
		<Icon icon="carbon:chevron-right" width="18" height="18" class="text-[#d1d1d1]" />
	</div>
	<span class="text-6xl">documents</span>
	<div class="mt-8">
		<div class="flex flex-col gap-3 overflow-y-scroll h-[45rem]">
			{#each $kernel.getParsedFiles() as file}
				<div class="flex flex-row gap-4">
					<span class="w-20 h-20">
						{#if file.type === 'directory'}
							<span class=" bg-[#ff00ff] w-full h-full justify-end items-end flex pr-2 pb-2 font-[500]"
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
					<div class="flex flex-col">
						<span>{file.name}</span>
						<span class="text-base text-[#656565]">{file.type}</span>
					</div>
				</div>
			{/each}
		</div>
	</div>
</div>

<button on:click={addNewFile}>Add New File</button>
