<script>
	import Input from '../../components/Input.svelte';
	import Select from '../../components/Select.svelte';
	import Button from '../../components/Button.svelte';
	import { addToast } from '../../store/toast';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { addMarketplaceItem } from '../../lib/marketplace-utils.js';
	import { getDefaultIcon, getDefaultBackground } from '../../lib/marketplace-utils.js';
	import Loader from '../../components/Loader.svelte';

	let itemName = '';
	let description = '';
	let itemType = 'app';
	let owner = '';
	let source = '';
	let iconUrl = '';
	let backgroundColor = '';
	let category = 'productivity';
	let tags = '';
	let isPublic = true;
	let isExiting = false;
	let isSubmitting = false;

	export let toggleBottomBar = () => {};
	export let changeSubPage = () => {};

	const itemTypes = ['app', 'music', 'photo', 'video', 'document'];

	const categories = {
		app: ['productivity', 'entertainment', 'utility', 'game', 'development'],
		music: ['pop', 'rock', 'classical', 'jazz', 'electronic', 'hip-hop'],
		photo: ['nature', 'portrait', 'landscape', 'abstract', 'street'],
		video: ['tutorial', 'entertainment', 'documentary', 'music-video', 'short-film'],
		document: ['pdf', 'text', 'presentation', 'spreadsheet', 'code']
	};

	$: availableCategories = categories[itemType] || [];
	$: category = availableCategories[0] || '';

	const close = () => {
		isExiting = true;
		setTimeout(() => {
			toggleBottomBar(false);
			changeSubPage('categories');
		}, 200);
	};

	const publish = async () => {
		if (!itemName || !description || !source) {
			addToast('Please fill all required fields', 2000);
			return;
		}

		isSubmitting = true;

		try {
			const itemData = {
				type: itemType,
				name: itemName,
				description: description,
				owner: owner || 'Anonymous', // You might want to get this from user authentication
				ownerId: 'anonymous', // You might want to get this from user authentication
				source: source,
				icon: iconUrl || getDefaultIcon(itemType),
				background: backgroundColor || getDefaultBackground(itemType),
				category: category || availableCategories[0],
				tags: tags
					.split(',')
					.map((tag) => tag.trim())
					.filter((tag) => tag),
				isPublic: isPublic
			};

			const itemId = await addMarketplaceItem(itemData);
			addToast('Item published successfully!', 3000);
			close();
		} catch (error) {
			console.error('Error publishing item:', error);
			addToast('Failed to publish item. Please try again.', 3000);
		} finally {
			isSubmitting = false;
		}
	};

	onMount(() => {
		toggleBottomBar(true);
	});
</script>

{#if isSubmitting}
	<div class="flex flex-col h-screen w-full items-center justify-center py-12 h-full my-16">
		<Loader />
	</div>
{/if}
{#if !isSubmitting}
	<div class="flex flex-col gap-4 bg-black rounded-lg h-screen page-holder">
		<span class="mt-4 text-6xl font-[300] mb-2 page px-4" class:page-exit={isExiting}>publish item</span>
		<div class="flex flex-col gap-6 page overflow-y-auto pb-20 px-4" class:page-exit={isExiting}>
			<Input bind:content={itemName} label="Item Name" />
			<Input bind:content={description} label="Description" />
			<Select bind:selection={itemType} data={itemTypes} label="Item Type" />
			<Input bind:content={owner} label="Owner (optional)" />
			<Input bind:content={source} label="Source URL" />
			<Input bind:content={iconUrl} label="Icon URL (optional)" />
			<Input bind:content={backgroundColor} label="Icon Background Color (e.g., #007AFF)" />
			<Select bind:selection={category} data={availableCategories} label="Category" />
			<Input bind:content={tags} label="Tags (comma-separated)" />
		</div>
	</div>
	<div
		class="w-full justify-between flex flex-row fixed bottom-0 right-0 px-4 py-2 bg-[#1f1f1f] gap-8 z-10 bottom-bar"
		class:bottom-bar-exit={isExiting}
	>
		<div class="btn w-full">
			<Button
				text={isSubmitting ? 'publishing...' : 'publish'}
				onClick={publish}
				className="btn !w-full bg-[#1f1f1f]"
				disabled={isSubmitting}
			/>
		</div>
		<div class="btn w-full">
			<Button text="close" onClick={close} className="btn !w-full bg-[#1f1f1f]" />
		</div>
	</div>
{/if}

<style>
</style>
