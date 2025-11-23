<script lang="ts">
	import * as PIXI from 'pixi.js';
	import { onMount, onDestroy, getContext, setContext } from 'svelte';

	let {
		x = 0,
		y = 0,
		rotation = 0,
		angle = 0,
		scale = 1,
		alpha = 1,
		pivot = 0,
		zIndex = 0,
		filters = [],
		children
	}: {
		x?: number;
		y?: number;
		rotation?: number;
		angle?: number;
		scale?: number | [number, number];
		alpha?: number;
		pivot?: number | [number, number];
		zIndex?: number;
		filters?: PIXI.Filter[];
		children?: any;
	} = $props();

	const app = getContext<PIXI.Application>('pixi-app');
	const parentContainer = getContext<PIXI.Container | null>('pixi-container');
	let container: PIXI.Container;

	onMount(() => {
		container = new PIXI.Container();
		container.x = x;
		container.y = y;
		container.rotation = angle ? (angle * Math.PI) / 180 : rotation;

		if (Array.isArray(scale)) {
			container.scale.set(scale[0], scale[1]);
		} else {
			container.scale.set(scale, scale);
		}

		if (Array.isArray(pivot)) {
			container.pivot.set(pivot[0], pivot[1]);
		} else {
			container.pivot.set(pivot, pivot);
		}

		container.alpha = alpha;
		container.zIndex = zIndex;
		container.sortableChildren = true;

		if (filters.length > 0) {
			container.filters = filters;
		}

		const target = parentContainer || app.stage;
		target.addChild(container);

		// Provide container context to child components
		setContext('pixi-container', container);
	});

	onDestroy(() => {
		if (container) {
			const target = parentContainer || app.stage;
			target.removeChild(container);
			container.destroy();
		}
	});

	// Update properties reactively
	$effect(() => {
		if (container) {
			container.x = x;
			container.y = y;
			container.rotation = angle ? (angle * Math.PI) / 180 : rotation;

			if (Array.isArray(scale)) {
				container.scale.set(scale[0], scale[1]);
			} else {
				container.scale.set(scale, scale);
			}

			if (Array.isArray(pivot)) {
				container.pivot.set(pivot[0], pivot[1]);
			} else {
				container.pivot.set(pivot, pivot);
			}

			container.alpha = alpha;
			container.zIndex = zIndex;

			if (filters.length > 0) {
				container.filters = filters;
			} else {
				container.filters = null;
			}
		}
	});
</script>

{#if container}
	{@render children?.()}
{/if}
