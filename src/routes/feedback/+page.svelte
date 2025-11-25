<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import BottomControls from '../../components/BottomControls.svelte';
	import Icon from '@iconify/svelte';
	import { borderColorClassStore, accentColorStore } from '../../utils/theme';
	import { addToast } from '../../store/toast';
	
	$: borderClass = $borderColorClassStore;
	$: accentColor = $accentColorStore;

	let isExiting = false;
	let isExpanded = false;
	let isUnmounting = false;
	let feedbackText = '';
	let feedbackTitle = '';

	function handleToggle(event) {
		isExpanded = event.detail.expanded;
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

	function sendFeedback() {
		if (!feedbackText.trim()) {
			addToast('Please enter your feedback', 2000);
			return;
		}

		// Create GitHub issue URL
		const title = feedbackTitle.trim() || 'User Feedback';
		const body = feedbackText.trim();
		
		// URL encode the title and body
		const encodedTitle = encodeURIComponent(title);
		const encodedBody = encodeURIComponent(body);
		
		// Open GitHub issue creation page in a new tab
		const githubIssueUrl = `https://github.com/god-s-perfect-idiot/ubiquity/issues/new?title=${encodedTitle}&body=${encodedBody}&labels=feedback`;
		window.open(githubIssueUrl, '_blank');
		
		// Show success message
		addToast('Opening GitHub issue...', 2000);
		
		// Optionally clear the form
		feedbackText = '';
		feedbackTitle = '';
	}

	onMount(() => {
		isExpanded = false;
	});
</script>

<div class="page-holder">
	<div class="page pt-4 px-4 flex flex-col h-screen overflow-y-auto" class:page-exit={isExiting}>
		<span class="text-6xl font-[300] mb-8 lowercase">feedback</span>
		
		<div class="flex flex-col gap-4 flex-1 pb-12">
			<!-- Title Input -->
			<div class="flex flex-col gap-2 font-[400]">
				<label for="feedback-title" class="text-[#767676] text-sm">Title (optional)</label>
				<input
					id="feedback-title"
					type="text"
					bind:value={feedbackTitle}
					placeholder="Brief description of your feedback"
					class="bg-[#bebebe] w-full py-2 pl-2 outline-none text-[#121212] text-base"
				/>
			</div>
			
			<!-- Feedback Textarea -->
			<div class="flex flex-col gap-2 font-[400] flex-1">
				<label for="feedback-text" class="text-[#767676] text-sm">Your Feedback</label>
				<textarea
					id="feedback-text"
					bind:value={feedbackText}
					placeholder="Share your thoughts, suggestions, or report issues..."
					class="bg-[#bebebe] w-full py-2 pl-2 outline-none text-[#121212] text-base resize-none flex-1 min-h-[200px]"
				></textarea>
			</div>
			
			<!-- Info Text -->
			<div class="flex flex-col gap-2">
				<span class="text-sm text-[#767676] opacity-70">
					Clicking <span style="color: {accentColor};">Send</span> will open a new GitHub issue with your feedback.
				</span>
			</div>
		</div>
	</div>
</div>

<BottomControls expanded={isExpanded} unmounting={isUnmounting} on:toggle={handleToggle}>
	<div class="flex flex-row gap-12 w-full justify-center items-center">
		<div
			class="btn-animate flex flex-col gap-2 justify-center items-center"
			class:animate={isExpanded}
		>
			<button
				on:click={sendFeedback}
				class="flex flex-col border {borderClass} rounded-full !border-2 p-2 font-bold"
			>
				<Icon icon="mdi:send" width="18" height="18" strokeWidth="2" />
			</button>
			<span class="text-xs font-[400]">send</span>
		</div>
		<div
			class="btn-animate flex flex-col gap-2 justify-center items-center"
			class:animate={isExpanded}
		>
			<button
				on:click={closePage}
				class="flex flex-col border {borderClass} rounded-full !border-2 p-2 font-bold"
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

	.page {
		scrollbar-width: thin;
		scrollbar-color: #4a5568 #1a202c;
	}

	.page::-webkit-scrollbar {
		width: 6px;
	}

	.page::-webkit-scrollbar-track {
		background: #1a202c;
	}

	.page::-webkit-scrollbar-thumb {
		background: #4a5568;
		border-radius: 3px;
	}

	.page::-webkit-scrollbar-thumb:hover {
		background: #718096;
	}
</style>

