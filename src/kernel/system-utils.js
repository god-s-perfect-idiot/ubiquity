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
    return  state.filter(file => file.type === 'app');
}
