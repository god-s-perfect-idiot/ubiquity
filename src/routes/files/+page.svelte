<script>
	import { kernel } from '../../kernel/store';

	function addNewFile() {
		kernel.addFile('newFile.txt',  'Hello, World!', "document");
		kernel.updateFS();
	}
</script>

<div class="flex flex-row gap-12 px-8">
    <button class={$kernel.isRoot() ? "underline text-[#d1d1d1]" : "underline text-[#f12] p-2"} disabled={$kernel.isRoot()}>Up</button>
    <button class="underline text-[#f12] p-2">Add New File</button>
    <button class="underline text-[#f12] p-2">Add New Folder</button>
</div>
<div>
	<ul>
		{#each $kernel.getParsedFiles() as file}
			<li>{file.name}</li>
		{/each}
	</ul>
</div>

<button on:click={addNewFile}>Add New File</button>
