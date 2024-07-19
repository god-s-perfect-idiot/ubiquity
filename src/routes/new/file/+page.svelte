<script>
    import { kernel } from '../../../kernel/store';

    let fileName = '';
    let fileContent = '';
    let fileType = 'document';
	$: fileName;
	$: fileContent;
	$: fileType;

	const add = () => {
        console.log(fileName, fileContent, fileType);
        if (fileName && fileContent && fileType) {
            kernel.addFile(fileName, fileContent, fileType);
            kernel.updateFS();
        }
	};
</script>

<div class="flex flex-col gap-4 mx-4">
    <span class="mt-4 text-6xl font-title mb-4">add file</span>
	<input type="text" placeholder="File Name" bind:value={fileName} />
	<textarea placeholder="File Content" bind:value={fileContent}></textarea>
	<select bind:value={fileType}>F
		<option>document</option>
		<option>image</option>
		<option>audio</option>
		<option>video</option>
		<option>app</option>
	</select>
	<button on:click={add}>Add</button>
</div>
