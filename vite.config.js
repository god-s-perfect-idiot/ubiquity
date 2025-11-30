import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		port: process.env.PORT || 3000,
		host: '0.0.0.0',
		allowedHosts: ['00a877360e2f.ngrok-free.app', 'localhost', '127.0.0.1']
	}
});
