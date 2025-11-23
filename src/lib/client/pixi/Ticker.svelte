<script lang="ts">
	import * as PIXI from 'pixi.js';
	import { onMount, onDestroy, getContext } from 'svelte';

	let {
		ontick,
		speed = 1
	}: {
		ontick: (event: CustomEvent<number>) => void;
		speed?: number;
	} = $props();

	const app = getContext<PIXI.Application>('pixi-app');
	let ticker: PIXI.Ticker;

	onMount(() => {
		ticker = PIXI.Ticker.shared;
		ticker.speed = speed;

		const tickHandler = (time: PIXI.Ticker) => {
			ontick(new CustomEvent('tick', { detail: time.deltaMS / 1000 }));
		};

		ticker.add(tickHandler);

		return () => {
			ticker.remove(tickHandler);
		};
	});

	// Update speed reactively
	$effect(() => {
		if (ticker) {
			ticker.speed = speed;
		}
	});
</script>
