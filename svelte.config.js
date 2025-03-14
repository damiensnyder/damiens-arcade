import nodeAdapter from '@sveltejs/adapter-node';
import { sveltePreprocess } from 'svelte-preprocess';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: sveltePreprocess(),
	kit: {
		adapter: nodeAdapter({
			out: "target"
		})
	}
};

export default config;
