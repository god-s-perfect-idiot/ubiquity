export function findType(file) {
	if (typeof Object.values(file)[0] !== 'string') return 'directory';
	switch (Object.keys(file)[0].slice(0, 1)) {
		case '1':
			return 'image';
		case '2':
			return 'document';
		case '3':
			return 'music';
		case '4':
			return 'video';
		case '5':
			return 'app';
	}
}

export function parseDirectoryContents(files) {
	const contents = Object.entries(files).map(([name, file]) => {
		const isDirectory = typeof file === 'object' && !Array.isArray(file);
		return {
			name: isDirectory ? name : name.slice(2, name.length),
			type: findType({ [name]: file }),
			content: file
		};
	});
	return contents;
}

export function requestFullscreen() {
	const element = document.documentElement;

	if (element.requestFullscreen) {
		element.requestFullscreen();
	} else if (element.mozRequestFullScreen) {
		// Firefox
		element.mozRequestFullScreen();
	} else if (element.webkitRequestFullscreen) {
		// Chrome, Safari and Opera
		element.webkitRequestFullscreen();
	} else if (element.msRequestFullscreen) {
		// IE/Edge
		element.msRequestFullscreen();
	}
}

function flatten(files, state) {
    Object.entries(files).forEach(([name, file]) => {
        if (typeof file === 'string') {
            state.push({name: name.slice(2, name.length), content: file, type: findType({[name]: file})});
        } else {
            flatten(file, state);
        }
    });
    return state;

}


export function fetchApps(files) {
    const apps = []
    const state = [];
    flatten(files, state);
    const appFiles = state.filter(file => file.type === 'app');
    
    // Add URL property for apps (the content is the URL)
    return appFiles.map(app => ({
        ...app,
        url: app.content
    }));
}

export function fetchPhotos(files) {
    const photos = []
    const state = [];
    flatten(files, state);
    return  state.filter(file => file.type === 'image');
}

export function fetchMusic(files) {
    const music = []
    const state = [];
    flatten(files, state);
    return  state.filter(file => file.type === 'music');
}

export function fetchVideos(files) {
	const videos = []
    const state = [];
    flatten(files, state);
    return  state.filter(file => file.type === 'video');
}

export function fetchDocuments(files) {
	const documents = []
    const state = [];
    flatten(files, state);
    return  state.filter(file => file.type === 'document');
}

/**
 * Generates a thumbnail for a video file
 * @param {Object} video - Video object with name and content properties
 * @param {number} width - Thumbnail width (default: 120)
 * @param {number} height - Thumbnail height (default: 68)
 * @param {number} seekTime - Time in seconds to seek to for thumbnail (default: 1)
 * @returns {Promise<string>} Promise that resolves to thumbnail data URL
 */
export function generateThumbnail(video, width = 120, height = 68, seekTime = 1) {
	return new Promise((resolve, reject) => {
		console.log('Starting thumbnail generation for:', video.name);
		console.log('Video content type:', typeof video.content);
		console.log('Video content:', video.content);
		
		// Check if content is a valid video source
		if (!video.content || typeof video.content !== 'string') {
			console.log('Invalid video content for:', video.name);
			reject(new Error('Invalid video content'));
			return;
		}

		const videoElement = document.createElement('video');
		videoElement.crossOrigin = 'anonymous';
		videoElement.muted = true;
		videoElement.playsInline = true;
		videoElement.preload = 'metadata';
		
		// Add more event listeners for debugging
		videoElement.onloadstart = () => console.log('Video load started for:', video.name);
		videoElement.onprogress = () => console.log('Video loading progress for:', video.name);
		videoElement.oncanplay = () => console.log('Video can play for:', video.name);
		videoElement.oncanplaythrough = () => console.log('Video can play through for:', video.name);
		
		videoElement.onloadeddata = () => {
			console.log('Video loaded for:', video.name, 'duration:', videoElement.duration);
			try {
				// Seek to specified time to get a good frame
				videoElement.currentTime = seekTime;
			} catch (e) {
				console.log('Could not seek video for thumbnail:', e);
				reject(e);
			}
		};

		videoElement.onseeked = () => {
			console.log('Video seeked for:', video.name);
			try {
				const canvas = document.createElement('canvas');
				const ctx = canvas.getContext('2d');
				canvas.width = width;
				canvas.height = height;
				
				ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
				const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.8);
				console.log('Thumbnail generated successfully for:', video.name);
				
				// Clean up
				videoElement.src = '';
				videoElement.load();
				
				resolve(thumbnailUrl);
			} catch (e) {
				console.log('Could not generate thumbnail for:', video.name, e);
				reject(e);
			}
		};

		videoElement.onerror = (e) => {
			console.log('Error loading video for thumbnail:', video.name, e);
			console.log('Video error details:', videoElement.error);
			reject(new Error('Failed to load video for thumbnail'));
		};

		// Set video source
		console.log('Setting video source for:', video.name, 'source:', video.content);
		videoElement.src = video.content;
	});
}