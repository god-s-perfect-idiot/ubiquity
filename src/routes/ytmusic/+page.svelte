<script>
	import BottomControls from '../../components/BottomControls.svelte';
	import Icon from '@iconify/svelte';
	import { goto } from '$app/navigation';
	import { onMount, tick } from 'svelte';
	import { browser } from '$app/environment';
	import { accountsStore } from '../../store/accounts.js';
	import { getAuthUrl } from '../../lib/ytmusic-config.js';
	import LetterGrid from '../../components/LetterGrid.svelte';
	import Loader from '../../components/Loader.svelte';
	import { accentColorStore, textColorClassStore } from '../../utils/theme';
	import { musicStore, currentTrack, isPlaying, playbackProgress } from '../../store/music.js';

	let isExpanded = false;
	let isUnmounting = false;
	let isExiting = false;
	let isLoading = false;
	let likedSongs = [];
	let accessToken = null;
	let showGrid = false;
	let musicList = {};
	let targetChar = '';

	// Subscribe to music store
	let currentTrackData = null;
	let isPlayingState = false;
	let progress = { currentTime: 0, duration: 0, seekValue: 0 };

	$: accentColor = $accentColorStore;
	$: textClass = $textColorClassStore;

	// Subscribe to music store
	$: currentTrackData = $currentTrack;
	$: isPlayingState = $isPlaying;
	$: progress = $playbackProgress;

	// Derived values for display
	$: nowPlayingTrack = currentTrackData && currentTrackData.type === 'ytmusic' ? currentTrackData : null;
	$: currentTime = progress.currentTime;
	$: duration = progress.duration;
	$: seekValue = progress.seekValue;

	let isInitializing = true;

	function handleToggle(event) {
		isExpanded = event.detail.expanded;
	}

	const closePage = () => {
		isUnmounting = true;
		setTimeout(() => {
			isExpanded = false;
			setTimeout(() => {
				isExiting = true;
				setTimeout(() => {
					goto('/');
				}, 200);
			}, 300);
		}, 300);
	};

	onMount(async () => {
		isInitializing = true;
		if (browser) {
			await initializeYTMusic();
		}
		isExpanded = false;
	});

	async function initializeYTMusic() {
		if (accountsStore.hasValidToken('ytmusic')) {
			accessToken = accountsStore.getAccessToken('ytmusic');
			// Playback is handled by the persistent YouTube player in the layout.
			await loadLikedSongs();
			isInitializing = false;
		} else {
			isInitializing = false;
		}
	}

	function buildImages(thumbnails) {
		if (!thumbnails) return [];
		return Object.values(thumbnails)
			.filter((t) => t && t.url)
			.map((t) => ({ url: t.url, width: t.width || 0, height: t.height || 0 }))
			.sort((a, b) => a.width - b.width);
	}

	async function loadLikedSongs() {
		if (!accessToken) return;

		isLoading = true;
		try {
			const response = await fetch(
				'https://www.googleapis.com/youtube/v3/videos?part=snippet&myRating=like&maxResults=50',
				{
					headers: {
						Authorization: `Bearer ${accessToken}`
					}
				}
			);

			if (response.status === 401) {
				await logout();
				return;
			}

			const data = await response.json();
			const items = data.items || [];

			// Normalize YouTube videos into the shared track shape.
			// Only keep items in the "Music" category (YouTube categoryId 10) so
			// the library shows YT Music songs rather than every liked video.
			const songs = items
				.filter((item) => item?.snippet?.title && item.snippet.categoryId === '10')
				.map((item) => ({
					videoId: item.id,
					name: item.snippet.title,
					artists: [{ name: item.snippet.videoOwnerChannelTitle || item.snippet.channelTitle || 'Unknown Artist' }],
					album: {
						name: item.snippet.channelTitle || '',
						images: buildImages(item.snippet.thumbnails)
					},
					type: 'ytmusic'
				}));

			likedSongs = songs.filter((song) => song.name && song.name.trim() !== '');

			// Sort songs alphabetically by name
			likedSongs.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));

			console.log(`Loaded ${likedSongs.length} liked YouTube songs in alphabetical order`);

			// Initialize queue in music store
			musicStore.setQueue(likedSongs);

			organizeSongsByLetter();
		} catch (error) {
			console.error('Error loading liked songs:', error);
		} finally {
			isLoading = false;
		}
	}

	function organizeSongsByLetter() {
		musicList = {};
		likedSongs.forEach((song) => {
			const firstLetter = song.name.charAt(0).toUpperCase();
			if (musicList[firstLetter]) {
				musicList[firstLetter].push(song);
			} else {
				musicList[firstLetter] = [song];
			}
		});
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
		);
		targetChar = '';
	}

	async function login() {
		window.location.href = getAuthUrl();
	}

	async function logout() {
		accountsStore.logout('ytmusic');
		accountsStore.cleanupStorage('ytmusic');
		accessToken = null;
		likedSongs = [];
		musicList = {};
		musicStore.clear();
	}

	async function playSong(song) {
		if (!song) return;

		try {
			const currentState = musicStore.getCurrentState();
			const songIndex = currentState.queue.findIndex((s) => s.videoId === song.videoId);

			await musicStore.playTrack(song, songIndex);
			showGrid = false;
		} catch (error) {
			console.error('Error playing song:', error);
			alert(`Error playing song: ${error.message || 'Unknown error'}`);
		}
	}

	async function playNext() {
		await musicStore.playNext();
	}

	async function playPrevious() {
		await musicStore.playPrevious();
	}

	async function togglePlayPause() {
		await musicStore.togglePlayPause();
	}

	function formatTime(seconds) {
		const mins = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60);
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	}

	function formatImageUrl(images, size = 300) {
		if (!images || images.length === 0) return null;
		return images.find((img) => img.width >= size)?.url || images[images.length - 1].url;
	}

	// Check if user is authenticated
	$: isAuthenticated = accountsStore.isAuthenticated('ytmusic');
</script>

<div class="page-holder">
	{#if isInitializing}
		<!-- Always show loader first -->
		<div class="page pt-4 px-4 flex flex-col h-screen" class:page-exit={isExiting}>
			<span class="text-6xl font-[300] h-[10%]">ytmusic</span>
			<div class="flex-1 flex flex-col items-center justify-center my-24">
				<Loader />
			</div>
		</div>
	{:else if !isAuthenticated}
		<!-- Login State -->
		<div class="page pt-4 px-4 flex flex-col h-screen" class:page-exit={isExiting}>
			<span class="text-6xl font-[300] h-[10%]">ytmusic</span>
			<div class="flex-1 flex flex-col items-start justify-center">
				<div class="max-w-md">
					<Icon icon="simple-icons:youtubemusic" width="150" height="150" class="text-red-500 mb-6" />
					<h2 class="text-3xl font-[300] mb-4">Connect Your YouTube Music Account</h2>
					<p class="text-gray-400 mb-8 font-[300] text-xl">
						Connect your YouTube account to access your liked songs and music library.
					</p>
					<button
						on:click={login}
						class="px-4 py-2 bg-red-600 hover:bg-red-700 {textClass} font-medium text-lg transition-colors"
					>
						Connect with YTMusic
					</button>
				</div>
			</div>
		</div>
	{:else if nowPlayingTrack && nowPlayingTrack.type === 'ytmusic'}
		<!-- Now Playing State -->
		<div
			class="flex flex-col pt-4 w-full font-[400] h-screen page px-4 overflow-x-hidden"
			class:page-exit={isExiting}
		>
			<span class="text-6xl font-[300] h-[10%]">ytmusic</span>
			<div class="flex flex-col gap-2 mb-16 overflow-x-hidden">
				<span class="text-4xl font-[300]">now playing</span>

				<!-- Album Art -->
				<div class="flex w-72 h-72 justify-center items-center mt-4">
					{#if nowPlayingTrack.album?.images && nowPlayingTrack.album.images.length > 0}
						<img
							src={formatImageUrl(nowPlayingTrack.album.images, 300)}
							alt={nowPlayingTrack.album.name}
							class="w-72 h-72 object-cover"
						/>
					{:else}
						<div class="w-72 h-72 bg-gray-700 flex items-center justify-center">
							<Icon icon="simple-icons:youtubemusic" width="168" height="168" class="text-gray-400" />
						</div>
					{/if}
				</div>

				<!-- Seek Bar -->
				<div class="flex flex-col gap-2 w-72 max-w-md">
					<div class="flex justify-between text-sm text-gray-400">
						<span>{formatTime(currentTime)}</span>
						<span>{formatTime(duration)}</span>
					</div>
					<div class="relative w-full h-2 bg-gray-200">
						<div
							class="absolute top-0 left-0 h-full bg-red-500 transition-all duration-100 ease-in-out"
							style="width: {seekValue}%"
						></div>
					</div>
				</div>

				<!-- Song Info -->
				<div class="flex flex-col gap-1 w-72 max-w-full">
					<span class="text-2xl font-[300] mt-2 truncate" title={nowPlayingTrack.name}>{nowPlayingTrack.name}</span>
					<span class="text-lg text-gray-400 truncate" title={nowPlayingTrack.artists?.map((a) => a.name).join(', ')}
						>{nowPlayingTrack.artists?.map((a) => a.name).join(', ')}</span
					>
				</div>

				<!-- Playback Controls -->
				<div class="flex flex-row justify-between mt-6 w-72">
					<button
						class="flex flex-row gap-4 items-center border-2 border-white rounded-full p-2"
						on:click={playPrevious}
					>
						<Icon icon="mdi:skip-previous" width="32" height="32" />
					</button>
					<button
						class="flex flex-row gap-4 items-center border-2 border-white rounded-full p-2"
						on:click={togglePlayPause}
					>
						<Icon icon={isPlayingState ? 'mdi:pause' : 'mdi:play'} width="32" height="32" />
					</button>
					<button
						class="flex flex-row gap-4 items-center border-2 border-white rounded-full p-2"
						on:click={playNext}
					>
						<Icon icon="mdi:skip-next" width="32" height="32" />
					</button>
				</div>
			</div>
		</div>
	{:else}
		<!-- Library State -->
		<div class="page-holder">
			{#if showGrid}
				<LetterGrid
					items={likedSongs}
					itemNameKey="name"
					{showGrid}
					{isExiting}
					onLetterClick={handleLetterClick}
				/>
			{:else}
				<div
					class="flex flex-col pt-4 w-full font-[400] h-screen page overflow-x-hidden"
					class:page-exit={isExiting}
				>
					<span class="text-6xl font-[300] h-[10%] px-4">ytmusic</span>
					<div class="flex flex-col gap-8 pb-16 mt-6 overflow-y-auto overflow-x-hidden px-4">
						{#if isLoading}
							<!-- Loading State -->
							<div class="flex flex-col gap-4 items-center justify-center my-24">
								<Loader />
							</div>
						{:else if likedSongs.length > 0}
							<!-- Liked Songs List -->
							{#each Object.entries(musicList) as musicEntry}
								<div class="flex flex-col gap-6">
									<button
										class="{textClass} text-3xl lowercase border-2 w-12 h-12 justify-start items-end flex pl-1 pb-1 font-[300]"
										style="background-color: {accentColor}; border-color: {accentColor};"
										id={musicEntry[0].toUpperCase()}
										on:click={() => {
											showGrid = true;
										}}
									>
										{musicEntry[0]}
									</button>
									{#each musicEntry[1] as song}
										<button
											class="flex flex-row gap-4 items-center w-full min-w-0"
											on:click={() => playSong(song)}
										>
											<!-- Album Art -->
											{#if song.album?.images && song.album.images.length > 0}
												<img
													src={song.album.images[0].url}
													alt={song.album.name}
													class="w-16 h-16 object-cover flex-shrink-0"
												/>
											{:else}
												<div
													class="w-12 h-12 rounded-lg bg-gray-700 flex items-start justify-center flex-shrink-0"
												>
													<Icon icon="simple-icons:youtubemusic" width="24" height="24" class="text-gray-400" />
												</div>
											{/if}

											<!-- Song Info -->
											<div class="flex flex-col min-w-0 flex-1 items-start overflow-hidden">
												<span class="text-2xl text-left font-[300] truncate w-full" title={song.name}>
													{song.name}
												</span>
												<span
													class="text-gray-400 text-left text-base font-[300] truncate w-full"
													title={song.artists?.map((a) => a.name).join(', ')}
												>
													{song.artists?.map((a) => a.name).join(', ') || 'Unknown Artist'}
												</span>
											</div>
										</button>
									{/each}
								</div>
							{/each}
						{:else}
							<!-- Empty State -->
							<div class="text-center py-12 mx-4">
								<Icon icon="simple-icons:youtubemusic" width="64" height="64" class="text-gray-500 mb-4" />
								<h3 class="text-xl font-semibold mb-2 justify-start flex font-[300]">
									No Liked Songs Found
								</h3>
								<p class="text-gray-400 font-[300] justify-start flex text-left text-lg">
									Like some songs on YouTube to see them here.
								</p>
							</div>
						{/if}
					</div>
				</div>
			{/if}
		</div>
	{/if}
</div>
<BottomControls expanded={isExpanded} unmounting={isUnmounting} on:toggle={handleToggle}>
	<div class="flex flex-row gap-12 justify-center items-center">
		{#if nowPlayingTrack}
			<div
				class="btn-animate flex flex-col gap-2 justify-center items-center"
				class:animate={isExpanded}
			>
				<button
					class="flex flex-col border border-white rounded-full !border-2 p-2 font-bold"
					on:click={() => {
						musicStore.clear();
					}}
				>
					<Icon icon="subway:left-arrow" width="18" height="18" strokeWidth="2" />
				</button>
				<span class="text-xs font-[400]">library</span>
			</div>
		{/if}
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
