// stores/toastStore.js
import { writable } from 'svelte/store';

export const toasts = writable([]);

export function addToast(content, duration = 2000) {
    const id = Math.floor(Math.random() * 10000);
    toasts.update(all => [...all, { id, content, duration }]);
    
    setTimeout(() => {
        removeToast(id);
    }, duration);
}

function removeToast(id) {
    toasts.update(all => all.filter(t => t.id !== id));
}