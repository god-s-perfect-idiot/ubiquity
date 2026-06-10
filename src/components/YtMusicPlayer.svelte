<script>
	import { browser } from '$app/environment';
	import { musicStore } from '../store/music.js';

	let player = null;
	let initStarted = false;

	// Lazily initialize the YouTube IFrame player the first time a YTMusic
	// track is requested. The player lives here (in the persistent layout) so
	// its iframe is never detached during in-app navigation.
	$: serviceType = $musicStore?.serviceType;

	$: if (browser && serviceType === 'ytmusic' && !initStarted) {
		initStarted = true;
		initPlayer();
	}

	function createPlayer() {
		if (!window.YT || !window.YT.Player) return;
		player = new window.YT.Player('ytmusic-player', {
			height: '1',
			width: '1',
			playerVars: {
				autoplay: 0,
				controls: 0,
				disablekb: 1,
				modestbranding: 1
			},
			events: {
				onReady: () => {
					musicStore.setYoutubePlayer(player);
					// If a YTMusic track was already selected before the player was
					// ready (first play), start it now.
					const state = musicStore.getCurrentState();
					if (state.serviceType === 'ytmusic' && state.currentTrack?.videoId) {
						musicStore.playTrack(state.currentTrack, state.currentIndex);
					}
				},
				onStateChange: (event) => {
					// YT.PlayerState.ENDED === 0 -> advance to the next track
					if (event.data === 0) {
						musicStore.playNext();
					}
				}
			}
		});
	}

	function initPlayer() {
		if (!browser) return;

		if (window.YT && window.YT.Player) {
			createPlayer();
			return;
		}

		// Load the IFrame Player API script once
		const existing = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
		if (!existing) {
			const script = document.createElement('script');
			script.src = 'https://www.youtube.com/iframe_api';
			document.head.appendChild(script);
		}

		// The API invokes this global once it has finished loading
		window.onYouTubeIframeAPIReady = createPlayer;
	}
</script>

{#if browser}
	<div
		style="position:fixed;width:1px;height:1px;left:-9999px;top:-9999px;overflow:hidden;pointer-events:none;"
	>
		<div id="ytmusic-player"></div>
	</div>
{/if}
