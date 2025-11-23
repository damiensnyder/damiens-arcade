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
	let app: PIXI.Application | null = $state(null);

	onMount(async () => {
		// Create PIXI application
		app = new PIXI.Application();
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

		// Provide app context to child components
		setContext('pixi-app', app);
		setContext('pixi-container', null);
	});

	onDestroy(() => {
		if (app) {
			app.destroy(true);
			app = null;
		}
	});
</script>

<div bind:this={canvasContainer} class="pixi-canvas">
	{#if app}
		{@render children?.()}
	{/if}
</div>

<style>
	.pixi-canvas {
		display: inline-block;
	}
</style>
