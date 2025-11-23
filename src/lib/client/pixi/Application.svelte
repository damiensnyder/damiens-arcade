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
	let app = new PIXI.Application();
	let ready = $state(false);

	// Set context immediately during component initialization
	setContext('pixi-app', app);
	setContext('pixi-container', null);

	onMount(async () => {
		// Initialize PIXI application
		await app.init({
			width,
			height,
			backgroundColor,
			antialias
		});

		// Make stage sortable
		app.stage.sortableChildren = true;

		// Add canvas to DOM
		canvasContainer.appendChild(app.canvas as HTMLCanvasElement);

		ready = true;
	});

	onDestroy(() => {
		if (app) {
			app.destroy(true);
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
