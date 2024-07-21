<script>
	import { onMount, tick } from 'svelte';

	let apps = [
		'Apple',
		'Google',
		'Microsoft',
		'Facebook',
		'Amazon',
		'Netflix',
		'Twitter',
		'Instagram',
		'Snapchat',
		'TikTok',
		'Play Store',
		'App Store',
		'WhatsApp',
		'Messenger',
		'YouTube',
		'Spotify',
		'Twitch',
		'Discord',
		'Slack',
		'Zoom',
		'Skype',
		'LinkedIn',
		'Pinterest',
		'Reddit',
		'Tumblr',
		'Telegram',
		'Signal',
		'WeChat',
		'Viber',
		'Line',
		'KakaoTalk',
		'Kik',
		'Snapchat'
	];

	const appList = {};
	let showGrid = false;
	const grid = [
		'#',
		'a',
		'b',
		'c',
		'd',
		'e',
		'f',
		'g',
		'h',
		'i',
		'j',
		'k',
		'l',
		'm',
		'n',
		'o',
		'p',
		'q',
		'r',
		's',
		't',
		'u',
		'v',
		'w',
		'x',
		'y',
		'z'
	];

	onMount(() => {
		apps = apps.sort();
		apps.forEach((app) => {
			const firstLetter = app.charAt(0).toUpperCase();
			if (appList[firstLetter]) {
				appList[firstLetter].push(app);
			} else {
				appList[firstLetter] = [app];
			}
		});
		console.log(appList);
	});

	let isExiting = false;
	let targetChar = '';

	async function scrollToChar(char) {
		await tick();
		const targetElement = document.getElementById(char);
		console.log(targetElement);
		if (targetElement) {
			targetElement.scrollIntoView({ behavior: 'instant' });
		}
	}

	function handleClick(char, event) {
		if (apps.find((app) => app.charAt(0).toLowerCase() === char)) {
			targetChar = char;
			event.preventDefault(); // Prevent immediate navigation
			isExiting = true;
			setTimeout(
				() => {
					const targetId = char.toUpperCase();
                    scrollToChar(targetId);
					showGrid = false;
					isExiting = false;
				},
				grid.length * 10 + 200
			); // Wait for all animations to complete
			targetChar = '';
		}
	}
</script>

{#if showGrid}
	<div class="flex justify-center items-start my-6">
		<div class="grid grid-cols-4 gap-x-3 gap-y-3">
			{#each grid as char, index}
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<a
					href={`#${char.toUpperCase()}`}
					class={`w-20 h-20 text-4xl justify-start items-end flex pl-1 pb-1 ${
						isExiting ? 'flip-out' : 'flip-in'
					} ${
						apps.find((app) => app.charAt(0).toLowerCase() === char) ? 'bg-[#f1b]' : 'bg-[#121212]'
					}`}
					style="animation-delay: {isExiting ? (grid.length - index) * 10 : index * 10}ms;"
					on:click={(event) => handleClick(char, event)}
				>
					{char}
				</a>
			{/each}
		</div>
	</div>
{:else}
	<div class="ml-16 mt-4 flex gap-2 flex-col mb-16">
		{#each Object.entries(appList) as appEntry}
			<div class="flex flex-col gap-2">
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<!-- svelte-ignore a11y-no-static-element-interactions -->
				<div
					class="text-[#f1b] text-3xl lowercase border-2 w-12 h-12 border-[#f1b] justify-start items-end flex pl-1 pb-1"
					id={appEntry[0].toUpperCase()}
					on:click={() => {
						showGrid = true;
					}}
				>
					{appEntry[0]}
				</div>
				{#each appEntry[1] as app}
					<div class="flex flex-row gap-4 items-center">
						<span class="w-12 h-12 bg-[#f1b] justify-center items-center flex">{appEntry[0]}</span>
						<span> {app}</span>
					</div>
				{/each}
			</div>
		{/each}
	</div>
{/if}

<style>
	.flip-in {
		animation: flipIn 0.2s ease-out backwards;
		backface-visibility: hidden;
		transform-style: preserve-3d;
	}

	.flip-out {
		animation: flipOut 0.2s ease-in forwards;
	}

	@keyframes flipIn {
		from {
			transform: rotateX(90deg);
			opacity: 0;
		}
		to {
			transform: rotateX(0deg);
			opacity: 1;
		}
	}

	@keyframes flipOut {
		from {
			transform: rotateX(0deg);
			opacity: 1;
		}
		to {
			transform: rotateX(90deg);
			opacity: 0;
		}
	}
</style>
