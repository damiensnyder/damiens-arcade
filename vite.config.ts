import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { webSocketServer } from './src/lib/server/vite-ws-plugin';

export default defineConfig({
	plugins: [
		webSocketServer(), // Must come before sveltekit()
		sveltekit()
	],
	optimizeDeps: {
		include: ['pixi.js']
	},
	server: {
		port: 3000,
		fs: {
			allow: ['static']
		}
	}
});
