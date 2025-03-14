import { sveltekit } from '@sveltejs/kit/vite';

/** @type {import('vite').UserConfig} */
const config = {
	envPrefix: "BACKEND_",
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
		port: 3000
	}
};

export default config;