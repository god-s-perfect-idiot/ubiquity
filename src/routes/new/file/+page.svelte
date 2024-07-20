<script>
	import { kernel } from '../../../kernel/store';
	import Input from '../../../components/Input.svelte';
	import Select from '../../../components/Select.svelte';
	import Button from '../../../components/Button.svelte';

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

<div class="flex flex-col gap-4 mx-4 bg-black rounded-lg h-screen page-holder">
	<span class="mt-4 text-6xl font-[300] mb-2 page">add file</span>
	<div class="flex flex-col gap-6 page">
		<Input bind:content={fileName} label="Filename" />
		<Input bind:content={fileContent} label="Target" />
		<Select
			bind:selection={fileType}
			data={['document', 'image', 'music', 'video', 'app']}
			label="Select document type"
		/>
	</div>
</div>
<div
	class="w-full justify-between flex flex-row absolute bottom-0 right-0 px-4 py-2 bg-[#1f1f1f] gap-8 z-10 bottom-bar"
>
	<div class="btn w-full">
		<Button text="add" onClick={add} className="btn !w-full bg-[#1f1f1f]" />
	</div>
	<div class="btn w-full">
		<Button text="close" onClick={() => {}} className="btn !w-full bg-[#1f1f1f]" />
	</div>
</div>

<style>
	.page-holder {
		perspective: 1000px;
	}
	.page {
		transform-origin: left;
		animation: flipIn 0.3s ease-out;
	}
	.bottom-bar {
		animation: creep-in 0.3s ease-out forwards;
	}
	.btn {
		animation: button-overshoot 0.5s ease-out forwards;
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
	@keyframes creep-in {
		from {
			transform: translateY(100%);
		}
		to {
			transform: translateY(0);
		}
	}
	@keyframes flipIn {
		from {
			transform: rotateY(90deg);
		}
		to {
			transform: rotateY(0);
		}
	}
</style>
