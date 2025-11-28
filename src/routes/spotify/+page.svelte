<script>
	import BottomControls from '../../components/BottomControls.svelte';
	import Icon from '@iconify/svelte';
	import { goto } from '$app/navigation';
	import { onMount, tick } from 'svelte';
	import { browser } from '$app/environment';
	import { accountsStore } from '../../store/accounts.js';
	import { getAuthUrl } from '../../lib/spotify-config.js';
	import LetterGrid from '../../components/LetterGrid.svelte';
	import Select from '../../components/Select.svelte';
	import Loader from '../../components/Loader.svelte';
	import { accentColorStore, textColorClassStore } from '../../utils/theme';

	let isExpanded = false;
	let isUnmounting = false;
	let isExiting = false;
	let isLoading = false;
	let likedSongs = [];
	let spotifyApi = null;
	let showGrid = false;
	let musicList = {};
	let targetChar = '';

	// Now playing state
	let nowPlayingTrack = null;
	let isPlaying = false;
	let currentTime = 0;
	let duration = 0;
	let seekValue = 0;
	let currentSongIndex = -1;
	let queue = [];
	
	$: accentColor = $accentColorStore;
	$: textClass = $textColorClassStore;
	let availableDevices = [];
	let selectedDeviceId = null;
	let selectedDeviceName = null;
	let webPlayerReady = false;

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

	// Initialize Spotify on page load
	onMount(async () => {
		isInitializing = true;
		if (browser) {
			await initializeSpotify();
		}
		isExpanded = false;
	});

	let isInitializing = true; // New variable to track initialization status

	async function initializeSpotify() {
		// Check if we have a valid token
		if (accountsStore.hasValidToken('spotify')) {
			const token = accountsStore.getAccessToken('spotify');
			await initializeSpotifyApi(token);
			await initializeWebPlayer(token);
			await loadAvailableDevices();
			// Poll for devices a few times to catch the web player
			setTimeout(() => loadAvailableDevices(), 2000);
			setTimeout(() => loadAvailableDevices(), 4000);
			await loadLikedSongs();
			isInitializing = false; // Mark as done initializing
		} else {
			isInitializing = false; // Mark as done even if not authenticated
		}
	}

	async function initializeSpotifyApi(token) {
		try {
			// Dynamically import Spotify Web API
			const { default: SpotifyWebApi } = await import('spotify-web-api-js');
			spotifyApi = new SpotifyWebApi();
			spotifyApi.setAccessToken(token);
		} catch (error) {
			console.error('Error initializing Spotify API:', error);
		}
	}

	async function initializeWebPlayer(token) {
		if (!browser) return;
		
		// Load Spotify Web Playback SDK script
		return new Promise((resolve) => {
			if (window.Spotify) {
				setupWebPlayer(token);
				resolve();
				return;
			}

			const script = document.createElement('script');
			script.src = 'https://sdk.scdn.co/spotify-player.js';
			script.async = true;
			script.onload = () => {
				setupWebPlayer(token);
				resolve();
			};
			script.onerror = () => {
				console.error('Failed to load Spotify Web Playback SDK');
				resolve();
			};
			document.head.appendChild(script);
		});
	}

	function setupWebPlayer(initialToken) {
		if (!window.Spotify || !browser) return;

		try {
			const player = new window.Spotify.Player({
				name: 'Ubiquity Web Player',
				getOAuthToken: (cb) => {
					// Get fresh token from accounts store
					if (accountsStore.hasValidToken('spotify')) {
						const currentToken = accountsStore.getAccessToken('spotify');
						cb(currentToken);
					} else {
						cb(initialToken);
					}
				},
				volume: 0.5
			});

			// Error handling
			player.addListener('initialization_error', ({ message }) => {
				console.error('Spotify Player initialization error:', message);
			});

			player.addListener('authentication_error', ({ message }) => {
				console.error('Spotify Player authentication error:', message);
			});

			player.addListener('account_error', ({ message }) => {
				console.error('Spotify Player account error:', message);
			});

			player.addListener('playback_error', ({ message }) => {
				console.error('Spotify Player playback error:', message);
			});

			// Ready event
			player.addListener('ready', ({ device_id }) => {
				console.log('Spotify Web Player ready with device ID:', device_id);
				webPlayerReady = true;
				selectedDeviceId = device_id;
				selectedDeviceName = 'Ubiquity Web Player';
				// Reload devices to include this one
				loadAvailableDevices();
			});

			// Connect to the player
			player.connect().then((success) => {
				if (success) {
					console.log('Spotify Web Player connected successfully');
				}
			}).catch((error) => {
				console.error('Failed to connect Spotify Web Player:', error);
			});

			// Store player globally for cleanup if needed
			window.spotifyPlayer = player;
		} catch (error) {
			console.error('Error setting up Spotify Web Player:', error);
		}
	}

	async function loadAvailableDevices() {
		if (!spotifyApi) return;

		try {
			const devices = await spotifyApi.getMyDevices();
			availableDevices = devices.devices || [];

			// Prioritize our embedded web player
			const ubiquityPlayer = availableDevices.find(
				(device) => device.name === 'Ubiquity Web Player'
			);

			if (ubiquityPlayer) {
				selectedDeviceId = ubiquityPlayer.id;
				selectedDeviceName = ubiquityPlayer.name;
				console.log('Selected Ubiquity Web Player device:', ubiquityPlayer.id);
			} else {
				// Fallback to other web players
				const webPlayer = availableDevices.find(
					(device) =>
						device.type === 'Computer' &&
						(device.name.includes('Web Player') ||
							device.name.includes('Chrome') ||
							device.name.includes('Safari'))
				);

				if (webPlayer) {
					selectedDeviceId = webPlayer.id;
					selectedDeviceName = webPlayer.name;
					console.log('Selected web player device:', webPlayer.name);
				} else if (availableDevices.length > 0) {
					selectedDeviceId = availableDevices[0].id;
					selectedDeviceName = availableDevices[0].name;
					console.log('Selected device:', availableDevices[0].name);
				}
			}

			console.log('Available devices:', availableDevices);
		} catch (error) {
			console.error('Error loading devices:', error);
		}
	}

	async function loadLikedSongs() {
		if (!spotifyApi) return;

		isLoading = true;
		try {
			// Fetch all liked songs using pagination
			let allSongs = [];
			let offset = 0;
			const limit = 50; // Spotify's maximum limit
			let hasMore = true;

			while (hasMore) {
				const response = await spotifyApi.getMySavedTracks({ limit, offset });
				const songs = response.items.map((item) => item.track);

				if (songs.length === 0) {
					hasMore = false;
				} else {
					allSongs = allSongs.concat(songs);
					offset += limit;

					// If we got less than the limit, we've reached the end
					if (songs.length < limit) {
						hasMore = false;
					}
				}
				// disable this for local development. keep enabled or we will hit the rate limit.
				// hasMore = false;
			}

			// Filter out songs without names
			likedSongs = allSongs.filter((song) => song.name && song.name.trim() !== '');

			// Sort songs alphabetically by name
			likedSongs.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));

			console.log(`Loaded ${likedSongs.length} total liked songs in alphabetical order (filtered)`);

			// Initialize queue
			queue = likedSongs;

			// Organize songs by first letter for LetterGrid
			organizeSongsByLetter();
		} catch (error) {
			console.error('Error loading liked songs:', error);
			// If token is invalid, logout
			if (error.status === 401) {
				await logout();
			}
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
		console.log(targetElement);
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

	async function login() {
		window.location.href = getAuthUrl();
	}

	async function logout() {
		// Disconnect web player if it exists
		if (window.spotifyPlayer) {
			try {
				await window.spotifyPlayer.disconnect();
			} catch (error) {
				console.error('Error disconnecting player:', error);
			}
			window.spotifyPlayer = null;
		}
		
		accountsStore.logout('spotify');
		accountsStore.cleanupStorage('spotify');
		spotifyApi = null;
		likedSongs = [];
		musicList = {};
		nowPlayingTrack = null;
		isPlaying = false;
		webPlayerReady = false;
	}

	async function playSong(uri, song = null) {
		if (!spotifyApi) return;

		try {
			// Use selected device if available
			if (selectedDeviceId) {
				await spotifyApi.play({
					uris: [uri],
					device_id: selectedDeviceId
				});

				const selectedDevice = availableDevices.find((d) => d.id === selectedDeviceId);
				console.log(
					'Playing song:',
					uri,
					'on selected device:',
					selectedDevice?.name || selectedDeviceId
				);

				// Update now playing state
				if (song) {
					nowPlayingTrack = song;
					currentSongIndex = queue.findIndex((s) => s.uri === uri);
					isPlaying = true;
					showGrid = false;
					startPlaybackPolling();
				}
				return;
			}

			// Fallback: check for available devices
			const devices = await spotifyApi.getMyDevices();
			console.log(devices);

			if (!devices.devices || devices.devices.length === 0) {
				console.error('No Spotify devices available. Opening Spotify web player...');

				// Try to open Spotify web player and then play
				const webPlayerUrl = 'https://open.spotify.com';
				const newTab = window.open(webPlayerUrl, '_blank');

				// Wait a moment for the tab to open, then try to play
				setTimeout(async () => {
					try {
						// Try playing without device ID (will use web player if it's active)
						await spotifyApi.play({ uris: [uri] });
						console.log('Playing song on web player:', uri);

						// Update now playing state
						if (song) {
							nowPlayingTrack = song;
							currentSongIndex = queue.findIndex((s) => s.uri === uri);
							isPlaying = true;
							showGrid = false;
							startPlaybackPolling();
						}
					} catch (webPlayerError) {
						console.error('Web player playback failed:', webPlayerError);
						alert(
							"Please:\n1. Keep the Spotify web player tab open\n2. Make sure you're logged in\n3. Try playing the song again"
						);
					}
				}, 2000);

				return;
			}

			// Try to play on the first available device
			const deviceId = selectedDeviceId || devices.devices[0].id; // Use selectedDeviceId if available, otherwise first device
			await spotifyApi.play({
				uris: [uri],
				device_id: deviceId
			});

			console.log(
				'Playing song:',
				uri,
				'on device:',
				devices.devices.find((d) => d.id === deviceId)?.name || 'web player'
			);

			// Update now playing state
			if (song) {
				nowPlayingTrack = song;
				currentSongIndex = queue.findIndex((s) => s.uri === uri);
				isPlaying = true;
				showGrid = false;

				// Start polling for playback state
				startPlaybackPolling();
			}
		} catch (error) {
			console.error('Error playing song:', error);

			if (error.status === 404) {
				// Try opening web player as fallback
				const webPlayerUrl = 'https://open.spotify.com';
				window.open(webPlayerUrl, '_blank');

				alert(
					"No active Spotify device found.\n\nI've opened Spotify web player for you.\n\nPlease:\n1. Keep the web player tab open\n2. Log in to Spotify\n3. Try playing the song again\n\nYour app will control the web player once it's active."
				);
			} else if (error.status === 403) {
				alert('Playback control requires a Spotify Premium account.');
			} else {
				alert(`Error playing song: ${error.message || 'Unknown error'}`);
			}
		}
	}

	async function playNext() {
		if (queue.length > 0 && currentSongIndex >= 0) {
			const nextIndex = (currentSongIndex + 1) % queue.length;
			const nextSong = queue[nextIndex];
			await playSong(nextSong.uri, nextSong);
		}
	}

	async function playPrevious() {
		if (queue.length > 0 && currentSongIndex >= 0) {
			const prevIndex = currentSongIndex <= 0 ? queue.length - 1 : currentSongIndex - 1;
			const prevSong = queue[prevIndex];
			await playSong(prevSong.uri, prevSong);
		}
	}

	async function togglePlayPause() {
		if (!spotifyApi) return;

		try {
			// Use selected device if available, otherwise get available devices
			let deviceId = selectedDeviceId;

			if (!deviceId) {
				const devices = await spotifyApi.getMyDevices();
				if (!devices.devices || devices.devices.length === 0) {
					alert('No Spotify devices available. Please open Spotify app or web player first.');
					return;
				}
				deviceId = devices.devices[0].id;
			}

			if (isPlaying) {
				await spotifyApi.pause({ device_id: deviceId });
				isPlaying = false;
			} else {
				await spotifyApi.play({ device_id: deviceId });
				isPlaying = true;
			}
		} catch (error) {
			console.error('Error toggling play/pause:', error);

			// Handle different types of errors
			if (error.status === 401) {
				alert('Authentication expired. Please log in to Spotify again.');
				await logout();
			} else if (error.status === 429) {
				alert('Rate limit exceeded. Please wait a moment before trying again.');
			} else if (error.status === 404) {
				alert(
					'Cannot control playback. Please make sure Spotify app is open and you have an active device.'
				);
			} else if (error.status === 403) {
				alert('Playback control requires a Spotify Premium account.');
			} else if (error.message && error.message.includes('JSON')) {
				console.error('Non-JSON response received. This might be a network issue or API problem.');
				alert('Network or API issue detected. Please try again or check your connection.');
			} else {
				alert(`Error controlling playback: ${error.message || 'Unknown error'}`);
			}
		}
	}

	async function startPlaybackPolling() {
		// Poll for current playback state every 2 seconds
		const pollInterval = setInterval(async () => {
			if (!nowPlayingTrack || !spotifyApi) {
				clearInterval(pollInterval);
				return;
			}

			try {
				const playbackState = await spotifyApi.getMyCurrentPlaybackState();
				if (playbackState && playbackState.item) {
					// Update current time and duration
					currentTime = playbackState.progress_ms / 1000;
					duration = playbackState.item.duration_ms / 1000;
					seekValue = duration > 0 ? (currentTime / duration) * 100 : 0;

					// Check if still playing
					isPlaying = playbackState.is_playing;

					// Check if song ended
					if (!playbackState.is_playing && currentTime >= duration - 1) {
						playNext();
					}
				}
			} catch (error) {
				console.error('Playback polling error:', error);

				// Handle different types of errors during polling
				if (error.status === 401) {
					console.log('Authentication expired during polling, stopping poll');
					clearInterval(pollInterval);
					await logout();
				} else if (error.status === 429) {
					console.log('Rate limited during polling, reducing frequency');
					// Could implement exponential backoff here
				} else if (error.message && error.message.includes('JSON')) {
					console.error('Non-JSON response during polling - this might be a network issue');
					// Don't stop polling for network issues, just log them
				} else {
					console.error('Unknown error during playback polling:', error);
				}
			}
		}, 2000);

		// Clean up interval when component unmounts
		return () => clearInterval(pollInterval);
	}

	function formatTime(seconds) {
		const mins = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60);
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	}

	function formatImageUrl(images, size = 300) {
		if (!images || images.length === 0) return null;
		return images.find((img) => img.width >= size)?.url || images[0].url;
	}

	// Helper function to open Spotify web player
	function openSpotifyWebPlayer() {
		const webPlayerUrl = 'https://open.spotify.com';
		window.open(webPlayerUrl, '_blank');
	}

	// Check if user is authenticated
	$: isAuthenticated = accountsStore.isAuthenticated('spotify');

	// Reactive statement to update selected device when devices change
	$: if (availableDevices.length > 0 && !selectedDeviceId) {
		// Auto-select web player if available, otherwise first device
		const webPlayer = availableDevices.find(
			(device) =>
				device.type === 'Computer' &&
				(device.name.includes('Web Player') ||
					device.name.includes('Chrome') ||
					device.name.includes('Safari'))
		);

		if (webPlayer) {
			selectedDeviceId = webPlayer.id;
			selectedDeviceName = webPlayer.name;
			console.log('Auto-selected web player device:', webPlayer.name);
		} else {
			selectedDeviceId = availableDevices[0].id;
			selectedDeviceName = availableDevices[0].name;
			console.log('Auto-selected device:', availableDevices[0].name);
		}
	}

	// Reactive statement to sync selectedDeviceName with selectedDeviceId
	$: if (selectedDeviceName && availableDevices.length > 0) {
		const device = availableDevices.find((d) => d.name === selectedDeviceName);
		if (device) {
			selectedDeviceId = device.id;
			console.log('Device selection changed to:', device.name, 'ID:', device.id);
		}
	}
</script>

<div class="page-holder">
	{#if isInitializing}
		<!-- Always show loader first -->
		<div class="page pt-4 px-4 flex flex-col h-screen" class:page-exit={isExiting}>
			<span class="text-6xl font-[300] h-[10%]">spotify</span>
			<div class="flex-1 flex flex-col items-center justify-center my-24">
				<Loader />
			</div>
		</div>
	{:else if !isAuthenticated}
		<!-- Login State - shown after loading if no auth -->
		<div class="page pt-4 px-4 flex flex-col h-screen" class:page-exit={isExiting}>
			<span class="text-6xl font-[300] h-[10%]">spotify</span>
			<div class="flex-1 flex flex-col items-start justify-center">
				<div class="max-w-md">
					<Icon icon="mdi:music" width="150" height="150" class="text-green-500 mb-6" />
					<h2 class="text-3xl font-[300] mb-4">Connect Your Spotify Account</h2>
					<p class="text-gray-400 mb-8 font-[300] text-xl">
						Connect your Spotify account to access your liked songs and music library.
					</p>
					<button
						on:click={login}
						class="px-4 py-2 bg-green-600 hover:bg-green-700 {textClass} font-medium text-lg transition-colors"
					>
						Connect with Spotify
					</button>
				</div>
			</div>
		</div>
	{:else if nowPlayingTrack}
		<!-- Now Playing State -->
		<div
			class="flex flex-col pt-4 w-full font-[400] h-screen page px-4 overflow-x-hidden"
			class:page-exit={isExiting}
		>
			<span class="text-6xl font-[300] h-[10%]">spotify</span>
			<div class="flex flex-col gap-2 mb-16 overflow-x-hidden">
				<span class="text-4xl font-[300]">now playing</span>

				<!-- Album Art -->
				<div class="flex w-72 h-72 justify-center items-center mt-4">
					{#if nowPlayingTrack.album?.images}
						<img
							src={formatImageUrl(nowPlayingTrack.album.images, 300)}
							alt={nowPlayingTrack.album.name}
							class="w-72 h-72 object-cover"
						/>
					{:else}
						<div class="w-72 h-72 bg-gray-700 flex items-center justify-center">
							<Icon icon="mdi:music" width="168" height="168" class="text-gray-400" />
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
							class="absolute top-0 left-0 h-full bg-green-500 transition-all duration-100 ease-in-out"
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
						<Icon icon={isPlaying ? 'mdi:pause' : 'mdi:play'} width="32" height="32" />
					</button>
					<button
						class="flex flex-row gap-4 items-center border-2 border-white rounded-full p-2"
						on:click={playNext}
					>
						<Icon icon="mdi:skip-next" width="32" height="32" />
					</button>
				</div>
				<!-- <div class="flex flex-row gap-4 items-center mt-4 w-full">
                    <Select
                        bind:selection={selectedDeviceName}
                        data={availableDevices.map(device => device.name)}
                        label="Select device to play on"
                        className="w-full"
                    />
                </div> -->
			</div>
		</div>
	{:else}
		<!-- Library State -->
		<div>
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
					<span class="text-6xl font-[300] h-[10%] px-4">spotify</span>
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
											on:click={() => playSong(song.uri, song)}
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
													<Icon icon="mdi:music" width="24" height="24" class="text-gray-400" />
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
								<Icon icon="mdi:music" width="64" height="64" class="text-gray-500 mb-4" />
								<h3 class="text-xl font-semibold mb-2 justify-start flex font-[300]">
									No Liked Songs Found
								</h3>
								<p class="text-gray-400 font-[300] justify-start flex text-left text-lg">
									Like some songs on Spotify to see them here.
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
						nowPlayingTrack = null;
						isPlaying = false;
						currentTime = 0;
						duration = 0;
						seekValue = 0;
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
