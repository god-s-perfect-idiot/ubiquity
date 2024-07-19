// store.js
import { writable } from 'svelte/store';
import FileSystem from './file-system';
import * as DataStore from './data-store';

function createKernelStore() {
    const fileSystem = new FileSystem();
    const { subscribe, set, update } = writable(fileSystem);

    // Load initial state from local storage
    const savedState = DataStore.load('fileSystemState');

    const fileTypes = {
        "image": "1",
        "document": "2",
        "music": "3",
        "video": "4",
        "app": "5",
    };

    if (savedState) {
        fileSystem.restoreFS(savedState.files, savedState.cursor);
        set(fileSystem);
    }

    const store = {
        subscribe,
        updateFS: () => {
            update(fs => {
                // This will trigger reactivity
                return fs;
            });
            
            // Save to local storage
            DataStore.commit('fileSystemState', {
                files: fileSystem.files,
                cursor: fileSystem.cursor
            });
        },
        // Add other methods to interact with fileSystem
        addFile: (fileName, content, type) => {
            update(fs => {
                fs.createFile(fileName, fileTypes[type], content);
                return fs;
            });
        },
        removeFile: (fileName, type) => {
            update(fs => {
                fs.deleteFile(fileName, fileTypes[type]);
                return fs;
            });
        },
        addDirectory: (dirName) => {
            update(fs => {
                fs.createFolder(dirName);
                return fs;
            });
        },
        removeDirectory: (dirName) => {
            update(fs => {
                fs.deleteFolder(dirName);
                return fs;
            });
        },
        renameFile: (oldName, newName, type) => {
            update(fs => {
                fs.renameFile(oldName, newName, fileTypes[type]);
                return fs;
            });
        },
        renameDirectory: (oldName, newName) => {
            update(fs => {
                fs.renameFolder(oldName, newName);
                return fs;
            });
        },
        updateFile: (fileName, content, type) => {
            update(fs => {
                fs.updateFile(fileName, fileTypes[type], content);
                return fs;
            });
        },
        reformatFile: (fileName, newType) => {
            update(fs => {
                fs.reformatFile(fileName, fileTypes[newType]);
                return fs;
            });
        },
    };

    // Add fs property to directly access FileSystem methods
    store.fs = new Proxy(fileSystem, {
        get: (target, prop) => {
            if (typeof target[prop] === 'function') {
                return (...args) => {
                    const result = target[prop](...args);
                    store.updateFS();
                    return result;
                };
            }
            return target[prop];
        }
    });
    return store; 
}

export const kernel = createKernelStore();