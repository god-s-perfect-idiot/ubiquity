<script>
	import { kernel } from '../../../kernel/store';
	import Input from '../../../components/Input.svelte';
	import Select from '../../../components/Select.svelte';
	import Button from '../../../components/Button.svelte';
	import { addToast } from '../../../store/toast';
	import { goto } from '$app/navigation';

	let fileName = '';
	let fileContent = '';
	let fileType = 'document';
	$: fileName;
	$: fileContent;
	$: fileType;
	let isExiting = false;

	const close = () => {
		isExiting = true;
		setTimeout(() => {
			goto('/');
		}, 100); // Match this with the animation duration
	};

	const add = () => {
		if (fileName && fileContent && fileType) {
			isExiting = true;
			setTimeout(() => {
				kernel.addFile(fileName, fileContent, fileType);
				kernel.updateFS();
				close()
			}, 100); // Match this with the animation duration
		} else {
			addToast('Please fill all fields', 2000);
		}
	};
	// const add = () => {
	// 	if (fileName && fileContent && fileType) {
	// 		kernel.addFile(fileName, fileContent, fileType);
	// 		kernel.updateFS();
	// 	} else {
	// 		addToast('Please fill all fields', 2000);
	// 	}
	// };

</script>

<div class="flex flex-col gap-4 mx-4 bg-black rounded-lg h-screen page-holder">
	<span class="mt-4 text-6xl font-[300] mb-2 page" class:page-exit={isExiting}>add file</span>
	<div class="flex flex-col gap-6 page" class:page-exit={isExiting}>
		<Input bind:content={fileName} label="File Name" />
		<Input bind:content={fileContent} label="Target" />
		<Select
			bind:selection={fileType}
			data={['document', 'image', 'music', 'video', 'app']}
			label="Select document type"
		/>
	</div>
</div>
<div
    class="w-full justify-between flex flex-row fixed bottom-0 right-0 px-4 py-2 bg-[#1f1f1f] gap-8 z-10 bottom-bar"
    class:bottom-bar-exit={isExiting}
>
    <div class="btn w-full">
        <Button text="add" onClick={add} className="btn !w-full bg-[#1f1f1f]" />
    </div>
    <div class="btn w-full">
        <Button text="close" onClick={close} className="btn !w-full bg-[#1f1f1f]" />
    </div>
</div>

<style>
</style>
