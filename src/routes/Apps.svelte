<script>
	import { onMount } from 'svelte';

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
</script>

{#if showGrid}
	<div class="flex justify-center items-start mt-6">
		<div class="grid grid-cols-4 gap-x-4 gap-y-4">
			{#each grid as char}
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<!-- svelte-ignore a11y-no-static-element-interactions -->
				<a
					href={`#${char.toUpperCase()}`}
					class={`w-20 h-20 text-4xl justify-start items-end flex pl-1 pb-1 ${apps.find((app) => app.charAt(0).toLowerCase() === char) ? 'bg-[#f1b]' : 'bg-[#121212]'}`}
					on:click={() => {
						if (apps.find((app) => app.charAt(0).toLowerCase() === char)) showGrid = false;
					}}>{char}</a
				>
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
