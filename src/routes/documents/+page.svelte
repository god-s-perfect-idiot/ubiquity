<script>
	import { onMount, onDestroy, tick } from 'svelte';
	import { goto } from '$app/navigation';
	import Icon from '@iconify/svelte';
	import BottomControls from '../../components/BottomControls.svelte';
	import LetterGrid from '../../components/LetterGrid.svelte';
	import { fetchDocuments } from '../../kernel/system-utils';
	import { kernel } from '../../kernel/store';
	import { accentColorStore, backgroundClassStore, textColorClassStore, borderColorClassStore } from '../../utils/theme';

	let documents = [];
	let isExpanded = false;
	let isUnmounting = false;
	let isExiting = false;
	let documentList = {};
	let showGrid = false;

	// Touch gesture detection variables
	let touchStartY = 0;
	let touchStartX = 0;
	let touchEndY = 0;
	let touchEndX = 0;
	const TOUCH_THRESHOLD = 10; // pixels - if movement exceeds this, it's a scroll, not a tap

	const handleToggle = () => {
		isExpanded = !isExpanded;
	};

	function initializeDocuments() {
		documents = fetchDocuments(kernel.fs.getFiles());
		documents = documents.sort((a, b) => a.name.localeCompare(b.name));
		documents.forEach((doc) => {
			const firstLetter = doc.name.charAt(0).toUpperCase();
			if (documentList[firstLetter]) {
				documentList[firstLetter].push(doc);
			} else {
				documentList[firstLetter] = [doc];
			}
		});
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

	async function scrollToChar(char) {
		await tick();
		const targetElement = document.getElementById(char);
		if (targetElement) {
			targetElement.scrollIntoView({ behavior: 'instant' });
		}
	}

	function handleLetterClick(char) {
		targetChar = char;
		isExiting = true;
		setTimeout(
			() => {
				const targetId = char.toUpperCase();
				scrollToChar(targetId);
				showGrid = false;
				isExiting = false;
			},
			27 * 10 + 200 // 27 letters in the grid
		); // Wait for all animations to complete
		targetChar = '';
	}

	function handleDocumentTap(document) {
		// Only handle if it's a genuine tap (not a scroll)
		if (isTap()) {
			// Handle document tap - could open document viewer or editor
			console.log('Document tapped:', document.name);
			window.location.href = document.content;
		}
	}

	// Touch gesture handlers
	function handleTouchStart(event) {
		touchStartY = event.touches[0].clientY;
		touchStartX = event.touches[0].clientX;
	}

	function handleTouchEnd(event) {
		touchEndY = event.changedTouches[0].clientY;
		touchEndX = event.changedTouches[0].clientX;
	}

	function isTap() {
		const deltaY = Math.abs(touchEndY - touchStartY);
		const deltaX = Math.abs(touchEndX - touchStartX);
		return deltaY < TOUCH_THRESHOLD && deltaX < TOUCH_THRESHOLD;
	}

	let targetChar = '';
	
	// Get theme values
	$: accentColor = $accentColorStore;
	$: bgClass = $backgroundClassStore;
	$: textClass = $textColorClassStore;
	$: borderClass = $borderColorClassStore;

	onMount(() => {
		initializeDocuments();
		isExpanded = false;
	});
</script>

<div class="page-holder">
	{#if showGrid}
		<LetterGrid
			items={documents}
			itemNameKey="name"
			{showGrid}
			{isExiting}
			onLetterClick={handleLetterClick}
		/>
	{:else}
		<div
			class="flex flex-col pt-4 w-full font-[400] h-screen page px-4"
			class:page-exit={isExiting}
		>
			<span class="text-6xl font-[300] h-[10%]"> documents </span>
			<div class="flex flex-col gap-8 pb-16 mt-6 overflow-y-auto">
				{#each Object.entries(documentList) as docEntry}
					<div class="flex flex-col gap-2">
						<button
							class="{textClass} text-3xl lowercase border-2 w-12 h-12 justify-start items-end flex pl-1 pb-2 mb-4 font-[300]"
							style="background-color: {accentColor}; border-color: {accentColor};"
							id={docEntry[0].toUpperCase()}
							on:click={() => {
								showGrid = true;
							}}
							on:touchstart={handleTouchStart}
							on:touchend={(event) => {
								handleTouchEnd(event);
								if (isTap()) {
									showGrid = true;
								}
							}}
						>
							{docEntry[0]}
						</button>
						{#each docEntry[1] as doc}
							<button
								class="flex flex-row gap-4 items-start"
								on:click={() => {
									handleDocumentTap(doc);
								}}
								on:touchstart={handleTouchStart}
								on:touchend={(event) => {
									handleTouchEnd(event);
									handleDocumentTap(doc);
								}}
							>
								<span class="flex justify-center items-center border-2 {borderClass} h-full">
									<!-- <Icon icon="mdi:file-document" width="26" height="26" /> -->
									<div class="w-20 h-20 {bgClass} items-end justify-end flex pr-2 pb-2 font-[300]">
										doc
									</div>
								</span>
								<span class="{textClass} text-2xl font-[300] truncate max-w-64 pt-2" title={doc.name}
									>{doc.name}</span
								>
							</button>
						{/each}
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>

<BottomControls expanded={isExpanded} unmounting={isUnmounting} on:toggle={handleToggle}>
	<div class="flex flex-row gap-12 w-full justify-center items-center">
		<div
			class="btn-animate flex flex-col gap-2 justify-center items-center"
			class:animate={isExpanded}
		>
			<button
				on:click={closePage}
				class="flex flex-col border border-white rounded-full !border-2 p-2 font-bold"
			>
				<Icon icon="rivet-icons:close" width="18" height="18" strokeWidth="2" />
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
