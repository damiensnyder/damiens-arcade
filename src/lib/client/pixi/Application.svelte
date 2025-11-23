<script lang="ts">
	import * as PIXI from 'pixi.js';
	import { onMount, onDestroy, setContext } from 'svelte';

	let {
		width = 800,
		height = 600,
		backgroundColor = 0x000000,
		antialias = false,
		children
	}: {
		width?: number;
		height?: number;
		backgroundColor?: number;
		antialias?: boolean;
		children?: any;
	} = $props();

	let canvasContainer: HTMLDivElement;
	let app: PIXI.Application | null = null;
	let ready = $state(false);

	// Create wrapper object that will hold the app reference
	const appWrapper = { current: app };

	// Set context with wrapper immediately during component initialization
	setContext('pixi-app-wrapper', appWrapper);
	setContext('pixi-container', null);

	onMount(async () => {
		// Create and initialize PIXI application
		app = new PIXI.Application();
		await app.init({
			width,
			height,
			backgroundColor,
			antialias
		});

		// Update wrapper reference
		appWrapper.current = app;

		// Make stage sortable
		app.stage.sortableChildren = true;

		// Add canvas to DOM
		canvasContainer.appendChild(app.canvas as HTMLCanvasElement);

		ready = true;
	});

	onDestroy(() => {
		if (app) {
			app.destroy(true);
			app = null;
			appWrapper.current = null;
		}
	});
</script>

<div bind:this={canvasContainer} class="pixi-canvas">
	{#if ready}
		{@render children?.()}
	{/if}
</div>

<style>
	.pixi-canvas {
		display: inline-block;
	}
</style>
