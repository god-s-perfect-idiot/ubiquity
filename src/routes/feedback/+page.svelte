<script>
	import { goto } from '$app/navigation';
	import Button from '../../components/Button.svelte';
	import { accentColorStore, backgroundThemeStore } from '../../utils/theme';
	import { addToast } from '../../store/toast';
	
	$: accentColor = $accentColorStore;
	$: backgroundTheme = $backgroundThemeStore;
	$: bottomBarBg = backgroundTheme === 'light' ? '#dedede' : '#1f1f1f';

	let isExiting = false;
	let feedbackText = '';
	let feedbackTitle = '';

	function closePage() {
		isExiting = true;
		setTimeout(() => {
			goto('/');
		}, 200); // Match the animation duration
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

</script>

<div class="page-holder">
	<div class="page pt-4 px-4 flex flex-col h-screen overflow-y-auto" class:page-exit={isExiting}>
		<span class="text-6xl font-[300] mb-8 lowercase">feedback</span>
		
		<div class="flex flex-col gap-4 flex-1 pb-16">
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
<div
    class="w-full justify-between flex flex-row fixed bottom-0 right-0 px-4 py-2 gap-8 z-10 bottom-bar"
    class:bottom-bar-exit={isExiting}
    style="background-color: {bottomBarBg};"
>
    <div class="btn w-full">
        <Button text="send" onClick={sendFeedback} className="btn !w-full" style="background-color: {bottomBarBg};" />
    </div>
    <div class="btn w-full">
        <Button text="close" onClick={closePage} className="btn !w-full" style="background-color: {bottomBarBg};" />
    </div>
</div>

<style>
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

