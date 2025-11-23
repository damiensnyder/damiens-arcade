<script lang="ts">
	import * as PIXI from 'pixi.js';
	import { onMount, onDestroy, getContext } from 'svelte';

	let {
		texture,
		x = 0,
		y = 0,
		rotation = 0,
		scale = 1,
		alpha = 1,
		anchor = 0.5,
		pivot = 0,
		zIndex = 0,
		filters = []
	}: {
		texture: PIXI.Texture;
		x?: number;
		y?: number;
		rotation?: number;
		scale?: number | [number, number];
		alpha?: number;
		anchor?: number | [number, number];
		pivot?: number | [number, number];
		zIndex?: number;
		filters?: PIXI.Filter[];
	} = $props();

	const app = getContext<PIXI.Application>('pixi-app');
	const parentContainer = getContext<PIXI.Container>('pixi-container');
	let sprite: PIXI.Sprite;

	onMount(() => {
		sprite = new PIXI.Sprite(texture);
		sprite.x = x;
		sprite.y = y;
		sprite.rotation = rotation;

		if (Array.isArray(scale)) {
			sprite.scale.set(scale[0], scale[1]);
		} else {
			sprite.scale.set(scale, scale);
		}

		sprite.alpha = alpha;

		if (Array.isArray(anchor)) {
			sprite.anchor.set(anchor[0], anchor[1]);
		} else {
			sprite.anchor.set(anchor, anchor);
		}

		if (Array.isArray(pivot)) {
			sprite.pivot.set(pivot[0], pivot[1]);
		} else {
			sprite.pivot.set(pivot, pivot);
		}

		sprite.zIndex = zIndex;

		if (filters.length > 0) {
			sprite.filters = filters;
		}

		const target = parentContainer || app.stage;
		target.addChild(sprite);
	});

	onDestroy(() => {
		if (sprite) {
			const target = parentContainer || app.stage;
			target.removeChild(sprite);
			sprite.destroy();
		}
	});

	// Update properties reactively
	$effect(() => {
		if (sprite) {
			sprite.texture = texture;
			sprite.x = x;
			sprite.y = y;
			sprite.rotation = rotation;

			if (Array.isArray(scale)) {
				sprite.scale.set(scale[0], scale[1]);
			} else {
				sprite.scale.set(scale, scale);
			}

			sprite.alpha = alpha;

			if (Array.isArray(anchor)) {
				sprite.anchor.set(anchor[0], anchor[1]);
			} else {
				sprite.anchor.set(anchor, anchor);
			}

			if (Array.isArray(pivot)) {
				sprite.pivot.set(pivot[0], pivot[1]);
			} else {
				sprite.pivot.set(pivot, pivot);
			}

			sprite.zIndex = zIndex;

			if (filters.length > 0) {
				sprite.filters = filters;
			} else {
				sprite.filters = null;
			}
		}
	});
</script>
