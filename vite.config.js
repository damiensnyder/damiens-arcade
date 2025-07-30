import { sveltekit } from '@sveltejs/kit/vite';

/** @type {import('vite').UserConfig} */
const config = {
	optimizeDeps: {
		include: ["pixi.js"]
	},
	plugins: [
		sveltekit({ configFile: "svelte.config.js" }),
	],
	server: {
		fs: {
			allow: ["static"]
		},
		port: 3000,
		proxy: {
			'/socket.io': {
				target: 'http://localhost:3001',
				changeOrigin: true,
				ws: true
			},
			'/auction-tic-tac-toe/create-room': {
				target: 'http://localhost:3001',
				changeOrigin: true
			},
			'/mayhem-manager/create-room': {
				target: 'http://localhost:3001',
				changeOrigin: true
			}
		}
	}
};

export default config;