<script lang="ts">
	import * as PIXI from 'pixi.js';
	import { onMount, onDestroy, getContext } from 'svelte';

	let {
		text,
		x = 0,
		y = 0,
		rotation = 0,
		scale = 1,
		alpha = 1,
		anchor = 0.5,
		zIndex = 0,
		style = {}
	}: {
		text: string;
		x?: number;
		y?: number;
		rotation?: number;
		scale?: number | [number, number];
		alpha?: number;
		anchor?: number | [number, number];
		zIndex?: number;
		style?: Partial<PIXI.TextStyle>;
	} = $props();

	const app = getContext<PIXI.Application>('pixi-app');
	const parentContainer = getContext<PIXI.Container>('pixi-container');
	let textSprite: PIXI.Text;

	onMount(() => {
		textSprite = new PIXI.Text({ text, style: new PIXI.TextStyle(style) });
		textSprite.x = x;
		textSprite.y = y;
		textSprite.rotation = rotation;

		if (Array.isArray(scale)) {
			textSprite.scale.set(scale[0], scale[1]);
		} else {
			textSprite.scale.set(scale, scale);
		}

		textSprite.alpha = alpha;

		if (Array.isArray(anchor)) {
			textSprite.anchor.set(anchor[0], anchor[1]);
		} else {
			textSprite.anchor.set(anchor, anchor);
		}

		textSprite.zIndex = zIndex;

		const target = parentContainer || app.stage;
		target.addChild(textSprite);
	});

	onDestroy(() => {
		if (textSprite) {
			const target = parentContainer || app.stage;
			target.removeChild(textSprite);
			textSprite.destroy();
		}
	});

	// Update properties reactively
	$effect(() => {
		if (textSprite) {
			textSprite.text = text;
			textSprite.x = x;
			textSprite.y = y;
			textSprite.rotation = rotation;

			if (Array.isArray(scale)) {
				textSprite.scale.set(scale[0], scale[1]);
			} else {
				textSprite.scale.set(scale, scale);
			}

			textSprite.alpha = alpha;

			if (Array.isArray(anchor)) {
				textSprite.anchor.set(anchor[0], anchor[1]);
			} else {
				textSprite.anchor.set(anchor, anchor);
			}

			textSprite.zIndex = zIndex;
		}
	});
</script>
