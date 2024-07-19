import { parseDirectoryContents } from './system-utils.js';
/* File system uses local storage to store filesystem.
    It provides a simple API to read and write file information.
    It also provides a way to create directories and delete files. */

class FileSystem {
	constructor() {
		this.init();
	}
	init() {
		this.files = {};
		this.cursor = [];
	}

	// tools
	restoreFS(files, cursor) {
        console.log('fs:restoreFS:files:', files);
        console.log('fs:restoreFS:cursor:', cursor);
		this.files = files;
		this.cursor = cursor;
	}
	getFiles() {
		let files = this.files;
		for (let i = 0; i < this.cursor.length; i++) {
			files = files[this.cursor[i]];
		}
		console.log('fs:getFiles:cursor:', this.cursor);
		console.log('fs:getFiles:files in current dir:', files);
		return files;
	}
	getParsedFiles() {
		let files = this.files;
		for (let i = 0; i < this.cursor.length; i++) {
			files = files[this.cursor[i]];
		}
		console.log('fs:getFiles:cursor:', this.cursor);
        if (!files || typeof files !== 'object') return [];
		const parsedFiles = parseDirectoryContents(files);
		console.log('fs:getFiles:parsedFiles:', parsedFiles);
		return parsedFiles;
	}
	dumpFiles() {
		console.log(this.files);
	}
	getFS() {
		console.log('fs:getFS:files:', this.files);
		return this.files;
	}
	getFullCursor() {
		console.log('fs:getFullCursor:cursor:', this.cursor);
		return this.cursor;
	}
	getCursor() {
		console.log('fs:getCursor:cursor:', this.cursor[this.cursor.length - 1]);
		return this.cursor[this.cursor.length - 1];
	}
	resetCursor() {
		this.cursor = [];
	}
	resetFS() {
		this.files = {};
	}
    isRoot() {
        return this.cursor.length === 0;
    }

	// navigation
	changeDirectory(name) {
		console.log('fs:changeDirectory:name:', name);
		if (this.checkFolderExists(name)) {
			console.log('fs:changeDirectory:folder exists');
			this.cursor.push(name);
		} else {
			console.log('fs:changeDirectory:folder does not exist');
		}
	}
	goBack() {
		if (this.cursor.length > 0) {
			console.log('fs:goBack:cursor:', this.cursor);
			this.cursor.pop();
			console.log('fs:goBack:cursor:', this.cursor);
		}
	}

	// validation
	checkFileExists(name) {
		const files = this.getFiles();
		console.log('fs:checkFileExists:files:', files);
		const file = files[name];
		console.log('fs:checkFileExists:file:', file);
		return file !== undefined && typeof file !== 'object';
	}
	checkFolderExists(name) {
		console.log('fs:checkFolderExists:name:', name);
		const files = this.getFiles();
		const folder = files[name];
		console.log('fs:checkFolderExists:folder:', folder);
		return folder !== undefined && typeof folder === 'object';
	}

	// crud
	createFile(name, type, content) {
		const fileName = `${type}.${name}`;
		console.log('fs:createFile:fileName:', fileName);
		if (this.checkFileExists(fileName)) {
			console.log('fs:createFile:file already exists');
			return;
		}
		const path = this.cursor;
		let files = this.files;
		for (let i = 0; i < path.length; i++) {
			files = files[path[i]];
		}
		console.log('fs:createFile:files:', files);
		files[fileName] = content || '';
	}
	createFolder(name) {
		console.log('fs:createFolder:name:', name);
		if (this.checkFolderExists(name)) {
			console.log('fs:createFolder:file already exists');
			return;
		}
		const path = this.cursor;
		let files = this.files;
		for (let i = 0; i < path.length; i++) {
			files = files[path[i]];
		}
		console.log('fs:createFolder:files:', files);
		files[name] = {};
	}
	deleteFile(name, type) {
		const fileName = `${type}.${name}`;
		console.log('fs:deleteFile:name:', fileName);
		if (this.checkFileExists(fileName)) {
			console.log('fs:deleteFile:file exists');
			const files = this.getFiles();
			delete files[fileName];
		}
	}
	deleteFolder(name) {
		console.log('fs:deleteFolder:name:', name);
		if (this.checkFolderExists(name)) {
			console.log('fs:deleteFolder:folder exists');
			const files = this.getFiles();
			delete files[name];
		}
	}
	renameFile(name, type, newName) {
		const fileName = `${type}.${name}`;
		const newFileName = `${type}.${newName}`;
		console.log('fs:renameFile:name:', fileName);
		console.log('fs:reformatFile:newName:', newFileName);
		if (this.checkFileExists(fileName)) {
			console.log('fs:renameFile:file exists');
			const files = this.getFiles();
			files[newFileName] = files[fileName];
			delete files[fileName];
		}
	}
	renameFolder(name, newName) {
		console.log('fs:renameFolder:name:', name);
		if (this.checkFolderExists(name)) {
			console.log('fs:renameFolder:folder exists');
			const files = this.getFiles();
			files[newName] = files[name];
			delete files[name];
		}
	}
	reformatFile(name, type, newType) {
		const fileName = `${type}.${name}`;
		const newFileName = `${newType}.${name}`;
		console.log('fs:reformatFile:name:', fileName);
		console.log('fs:reformatFile:newName:', newFileName);
		if (this.checkFileExists(fileName)) {
			console.log('fs:reformatFile:file exists');
			const files = this.getFiles();
			files[newFileName] = files[fileName];
			delete files[fileName];
		}
	}
	updateFile(name, type, content) {
		const fileName = `${type}.${name}`;
		console.log('fs:updateFile:name:', fileName);
		if (this.checkFileExists(fileName)) {
			console.log('fs:updateFile:file exists');
			const files = this.getFiles();
			files[fileName] = content;
		}
	}
}

export default FileSystem;
