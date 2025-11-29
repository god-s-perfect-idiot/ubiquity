import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';

// Music service store - manages global music playback
function createMusicStore() {
  const { subscribe, set, update } = writable({
    // Current track info
    currentTrack: null, // { name, source, type: 'local' | 'spotify', uri?, album?, artists? }
    currentIndex: -1,
    queue: [],
    
    // Playback state
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    seekValue: 0,
    
    // Service type
    serviceType: null, // 'local' | 'spotify'
    
    // Internal references (not reactive)
    audioElement: null,
    spotifyApi: null,
    selectedDeviceId: null,
    playbackPollInterval: null
  });

  // Internal state management
  let internalState = {
    audioElement: null,
    spotifyApi: null,
    selectedDeviceId: null,
    playbackPollInterval: null
  };

  // Event handlers for audio element
  function handleMetadata() {
    if (internalState.audioElement) {
      update(s => ({ ...s, duration: internalState.audioElement.duration }));
    }
  }
  
  function handleTimeUpdate() {
    if (internalState.audioElement) {
      const currentState = getCurrentStateSync();
      if (currentState.duration > 0) {
        const currentTime = internalState.audioElement.currentTime;
        const seekValue = (currentTime / currentState.duration) * 100;
        update(s => ({ ...s, currentTime, seekValue }));
      }
    }
  }
  
  // Reference to store methods for event handlers (will be set after creation)
  let storeMethodsRef = null;
  
  function handleEnded() {
    // Auto-play next track
    if (storeMethodsRef) {
      const currentState = getCurrentStateSync();
      if (currentState.queue.length > 0) {
        storeMethodsRef.playNext();
      }
    }
  }
  
  function handleError() {
    console.error('Audio playback error');
    // Try to play next track on error
    if (storeMethodsRef) {
      const currentState = getCurrentStateSync();
      if (currentState.queue.length > 0) {
        storeMethodsRef.playNext();
      }
    }
  }
  
  // Helper to get current state synchronously
  function getCurrentStateSync() {
    let currentState;
    subscribe(state => currentState = state)();
    return currentState;
  }
  
  // Store methods
  const storeMethods = {
    subscribe,
    
    // Initialize audio element for local playback
    setAudioElement(element) {
      if (!browser) return;
      
      // Clean up old element listeners
      if (internalState.audioElement) {
        const oldElement = internalState.audioElement;
        oldElement.removeEventListener('loadedmetadata', handleMetadata);
        oldElement.removeEventListener('timeupdate', handleTimeUpdate);
        oldElement.removeEventListener('ended', handleEnded);
        oldElement.removeEventListener('error', handleError);
      }
      
      internalState.audioElement = element;
      
      if (element) {
        element.addEventListener('loadedmetadata', handleMetadata);
        element.addEventListener('timeupdate', handleTimeUpdate);
        element.addEventListener('ended', handleEnded);
        element.addEventListener('error', handleError);
      }
      
      update(s => ({ ...s, audioElement: element }));
    },
    
    // Set Spotify API instance
    setSpotifyApi(api) {
      internalState.spotifyApi = api;
      update(s => ({ ...s, spotifyApi: api }));
    },
    
    // Set selected Spotify device
    setSelectedDeviceId(deviceId) {
      internalState.selectedDeviceId = deviceId;
      update(s => ({ ...s, selectedDeviceId: deviceId }));
    },
    
    // Set queue
    setQueue(queue) {
      update(s => ({ ...s, queue }));
    },
    
    // Play a track
    async playTrack(track, index = -1) {
      if (!track) return;
      
      // Determine service type
      const serviceType = track.type || (track.uri ? 'spotify' : 'local');
      
      update(s => ({
        ...s,
        currentTrack: track,
        currentIndex: index >= 0 ? index : s.queue.findIndex(t => 
          (serviceType === 'spotify' && t.uri === track.uri) ||
          (serviceType === 'local' && t.content === track.content)
        ),
        serviceType,
        isPlaying: true,
        currentTime: 0,
        duration: 0,
        seekValue: 0
      }));
      
      if (serviceType === 'local') {
        await this.playLocalTrack(track);
      } else if (serviceType === 'spotify') {
        await this.playSpotifyTrack(track);
      }
    },
    
    // Play local track
    async playLocalTrack(track) {
      if (!internalState.audioElement || !track.content) return;
      
      try {
        // Pause current playback if any
        if (!internalState.audioElement.paused) {
          internalState.audioElement.pause();
        }
        
        // Reset current time
        internalState.audioElement.currentTime = 0;
        
        // Set new source
        internalState.audioElement.src = track.content;
        
        // Load the new source
        internalState.audioElement.load();
        
        // Wait a brief moment for the load to start, then play
        // Use a small timeout to ensure the audio element is ready
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Play the new track
        await internalState.audioElement.play();
        update(s => ({ ...s, isPlaying: true }));
      } catch (error) {
        console.error('Error playing local track:', error);
        update(s => ({ ...s, isPlaying: false }));
        
        // If play() fails, try again after a short delay
        // This handles cases where the audio element needs more time
        setTimeout(async () => {
          try {
            if (internalState.audioElement && internalState.audioElement.src === track.content) {
              await internalState.audioElement.play();
              update(s => ({ ...s, isPlaying: true }));
            }
          } catch (retryError) {
            console.error('Error retrying to play local track:', retryError);
          }
        }, 500);
      }
    },
    
    // Play Spotify track
    async playSpotifyTrack(track) {
      if (!internalState.spotifyApi || !track.uri) return;
      
      try {
        if (internalState.selectedDeviceId) {
          await internalState.spotifyApi.play({
            uris: [track.uri],
            device_id: internalState.selectedDeviceId
          });
        } else {
          await internalState.spotifyApi.play({ uris: [track.uri] });
        }
        
        update(s => ({ ...s, isPlaying: true }));
        this.startSpotifyPolling();
      } catch (error) {
        console.error('Error playing Spotify track:', error);
        update(s => ({ ...s, isPlaying: false }));
        throw error;
      }
    },
    
    // Toggle play/pause
    async togglePlayPause() {
      const currentState = getCurrentStateSync();
      
      if (currentState.serviceType === 'local') {
        if (internalState.audioElement) {
          if (currentState.isPlaying) {
            internalState.audioElement.pause();
          } else {
            await internalState.audioElement.play();
          }
          update(s => ({ ...s, isPlaying: !s.isPlaying }));
        }
      } else if (currentState.serviceType === 'spotify') {
        if (!internalState.spotifyApi) return;
        
        try {
          const deviceId = internalState.selectedDeviceId;
          
          if (currentState.isPlaying) {
            if (deviceId) {
              await internalState.spotifyApi.pause({ device_id: deviceId });
            } else {
              await internalState.spotifyApi.pause();
            }
            update(s => ({ ...s, isPlaying: false }));
          } else {
            if (deviceId) {
              await internalState.spotifyApi.play({ device_id: deviceId });
            } else {
              await internalState.spotifyApi.play();
            }
            update(s => ({ ...s, isPlaying: true }));
          }
        } catch (error) {
          console.error('Error toggling Spotify playback:', error);
        }
      }
    },
    
    // Play next track
    async playNext() {
      const currentState = getCurrentStateSync();
      if (currentState.queue.length === 0 || currentState.currentIndex < 0) return;
      
      const nextIndex = (currentState.currentIndex + 1) % currentState.queue.length;
      const nextTrack = currentState.queue[nextIndex];
      
      if (nextTrack) {
        await this.playTrack(nextTrack, nextIndex);
      }
    },
    
    // Play previous track
    async playPrevious() {
      const currentState = getCurrentStateSync();
      if (currentState.queue.length === 0 || currentState.currentIndex < 0) return;
      
      const prevIndex = currentState.currentIndex <= 0 
        ? currentState.queue.length - 1 
        : currentState.currentIndex - 1;
      const prevTrack = currentState.queue[prevIndex];
      
      if (prevTrack) {
        await this.playTrack(prevTrack, prevIndex);
      }
    },
    
    // Seek to position
    async seek(position) {
      const currentState = getCurrentStateSync();
      
      if (currentState.serviceType === 'local') {
        if (internalState.audioElement && currentState.duration > 0) {
          const newTime = (position / 100) * currentState.duration;
          internalState.audioElement.currentTime = newTime;
          update(s => ({ ...s, currentTime: newTime, seekValue: position }));
        }
      } else if (currentState.serviceType === 'spotify') {
        if (!internalState.spotifyApi || !currentState.duration) return;
        
        try {
          const positionMs = Math.floor((position / 100) * currentState.duration * 1000);
          const deviceId = internalState.selectedDeviceId;
          
          if (deviceId) {
            await internalState.spotifyApi.seek(positionMs, { device_id: deviceId });
          } else {
            await internalState.spotifyApi.seek(positionMs);
          }
          
          update(s => ({
            ...s,
            currentTime: positionMs / 1000,
            seekValue: position
          }));
        } catch (error) {
          console.error('Error seeking Spotify track:', error);
        }
      }
    },
    
    // Start polling for Spotify playback state
    startSpotifyPolling() {
      // Clear existing interval
      if (internalState.playbackPollInterval) {
        clearInterval(internalState.playbackPollInterval);
      }
      
      const pollInterval = setInterval(async () => {
        const currentState = getCurrentStateSync();
        
        if (!currentState.currentTrack || !internalState.spotifyApi || currentState.serviceType !== 'spotify') {
          clearInterval(pollInterval);
          internalState.playbackPollInterval = null;
          update(s => ({ ...s, playbackPollInterval: null }));
          return;
        }
        
        try {
          const playbackState = await internalState.spotifyApi.getMyCurrentPlaybackState();
          if (playbackState && playbackState.item) {
            const currentTime = playbackState.progress_ms / 1000;
            const duration = playbackState.item.duration_ms / 1000;
            const seekValue = duration > 0 ? (currentTime / duration) * 100 : 0;
            
            update(s => ({
              ...s,
              currentTime,
              duration,
              seekValue,
              isPlaying: playbackState.is_playing
            }));
            
            // Auto-play next if track ended
            if (!playbackState.is_playing && currentTime >= duration - 1) {
              this.playNext();
            }
          }
        } catch (error) {
          console.error('Spotify playback polling error:', error);
          if (error.status === 401) {
            clearInterval(pollInterval);
            internalState.playbackPollInterval = null;
            update(s => ({ ...s, playbackPollInterval: null }));
          }
        }
      }, 2000);
      
      internalState.playbackPollInterval = pollInterval;
      update(s => ({ ...s, playbackPollInterval: pollInterval }));
    },
    
    // Stop playback
    stop() {
      const currentState = getCurrentStateSync();
      
      if (currentState.serviceType === 'local' && internalState.audioElement) {
        internalState.audioElement.pause();
        internalState.audioElement.currentTime = 0;
      }
      
      if (internalState.playbackPollInterval) {
        clearInterval(internalState.playbackPollInterval);
        internalState.playbackPollInterval = null;
      }
      
      update(s => ({
        ...s,
        isPlaying: false,
        currentTime: 0,
        seekValue: 0,
        playbackPollInterval: null
      }));
    },
    
    // Clear current track
    clear() {
      this.stop();
      update(s => ({
        ...s,
        currentTrack: null,
        currentIndex: -1,
        queue: [],
        serviceType: null
      }));
    },
    
    // Get current state (for non-reactive access)
    getCurrentState() {
      return getCurrentStateSync();
    }
  };
  
  // Set reference for event handlers
  storeMethodsRef = storeMethods;
  
  return storeMethods;
}

export const musicStore = createMusicStore();

// Derived stores for convenience
export const currentTrack = derived(musicStore, $music => $music.currentTrack);
export const isPlaying = derived(musicStore, $music => $music.isPlaying);
export const playbackProgress = derived(musicStore, $music => ({
  currentTime: $music.currentTime,
  duration: $music.duration,
  seekValue: $music.seekValue
}));
