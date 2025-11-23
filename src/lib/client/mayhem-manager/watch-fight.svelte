<script lang="ts">
	import type { FighterVisual } from '$lib/shared/mayhem-manager/types';
	import FighterBattleInfo from './fighter-battle-info.svelte';
	import { onMount } from 'svelte';
	import Application from '$lib/client/pixi/Application.svelte';
import Container from '$lib/client/pixi/Container.svelte';
import Sprite from '$lib/client/pixi/Sprite.svelte';
import Text from '$lib/client/pixi/Text.svelte';
import Ticker from '$lib/client/pixi/Ticker.svelte';
	import FighterBattleSprite from './fighter-battle-sprite.svelte';
	import AnimationState, {
		type FighterParticle,
		getColorFilters,
		type Particle
	} from '$lib/shared/mayhem-manager/animation-state';
	import * as PIXI from 'pixi.js';
	import { gameStore } from './stores.svelte';

	const BUFFER_PIXELS = 15;

	let { debug = false }: { debug?: boolean } = $props();

	let eventLogRaw = $state('');
	let animationState = $state(new AnimationState(debug ? [] : gameStore.fightEvents));
	let fighters = $state<FighterVisual[]>([]);
	let particles = $state<Particle[]>([]);
	let fighterParticles = $state<FighterParticle[][]>([]);
	let playbackSpeed = $state(100); // ticks are 0.2 s long
	let frameWidth = $state(0);
	let frameHeight = $state(0);
	let cameraScale = $state(7);
	let cameraX = $state(50);
	let cameraY = $state(50);
	let targetCameraScale = $state(7);
	let targetCameraX = $state(50);
	let targetCameraY = $state(50);
	let tickDelta = $state(0);
	let paused = $state(true);
	let loaded = $state(false); // keeps pixi canvas from existing before its size is known

	// Watch for fight events changes
	$effect(() => {
		if (!debug) {
			animationState = new AnimationState(gameStore.fightEvents);
		}
	});

	onMount(() => {
		loaded = true;
		if (!debug) {
			play();
		} else {
			setCameraTarget();
		}
	});

	function doTick(e: CustomEvent): void {
		const delta = e.detail;
		if (!paused) {
			tickDelta += delta;
			while (tickDelta > 1) {
				animationState.prepareTick();
				tickDelta -= 1;
				// Check if fight is over
				if (animationState.fightOver) {
					setTimeout(() => {
						gameStore.watchingFight = false;
					}, 1000);
				}
			}
			renderFrame(delta);
		}
	}

	function renderFrame(delta: number): void {
		fighters = animationState.getFighters(tickDelta);
		particles = animationState.getParticles(tickDelta);
		fighterParticles = fighters.map((_, i) => {
			return particles.filter((p) => p.type === 'fighter' && p.fighter === i) as FighterParticle[];
		});
		setCameraTarget();
		// ideally it would move slower or faster based on size of difference. but that's for later
		cameraScale += (targetCameraScale - cameraScale) * Math.min(1, 1.5 * delta);
		cameraX += (targetCameraX - cameraX) * Math.min(1, 1.5 * delta);
		cameraY += (targetCameraY - cameraY) * Math.min(1, 1.5 * delta);
	}

	// Set camera transform so all fighters are visible but the camera is as zoomed as possible.
	// Camera should be centered, and the outermost fighters should be BUFFER_PIXELS from the
	// edge of the camera.
	function setCameraTarget(): void {
		const frameAspectRatio = frameWidth / frameHeight;
		if (fighters.filter((f) => f.hp > 0).length === 0) {
			if (frameAspectRatio < 1) {
				targetCameraScale = frameWidth / (50 + 2 * BUFFER_PIXELS);
			} else {
				targetCameraScale = frameHeight / (50 + 2 * BUFFER_PIXELS);
			}
			targetCameraX = 50;
			targetCameraY = 50;
		} else {
			// find the leftmost, rightmost, topmost, and bottommost coordinates a fighter has
			let left: number | undefined, right: number | undefined, top: number | undefined, bottom: number | undefined;
			for (const f of fighters) {
				if (f.hp > 0) {
					if (left === undefined || f.x < left) {
						left = f.x;
					}
					if (right === undefined || f.x > right) {
						right = f.x;
					}
					if (top === undefined || f.y < top) {
						top = f.y;
					}
					if (bottom === undefined || f.y > bottom) {
						bottom = f.y;
					}
				}
			}
			const contentAspectRatio =
				(right - left + 2 * BUFFER_PIXELS) / (bottom - top + 2 * BUFFER_PIXELS);
			// if content has wider aspect ratio than the frame, set the zoom based on width
			// if taller, set based on height
			if (frameAspectRatio < contentAspectRatio) {
				targetCameraScale = frameWidth / (right - left + 2 * BUFFER_PIXELS);
			} else {
				targetCameraScale = frameHeight / (bottom - top + 2 * BUFFER_PIXELS);
			}
			targetCameraX = (right + left) / 2;
			targetCameraY = (top + bottom) / 2;
		}
	}

	// Parse events entered manually
	function enterEvents(): void {
		try {
			const e = JSON.parse('[' + eventLogRaw.replaceAll('][', '],[') + ']');
			gameStore.fightEvents = e;
			play();
		} catch (e) {
			window.alert('Error: Could not parse events.');
		}
	}

	// Start playing the fight
	function play(): void {
		tickDelta = 0;
		paused = false;
	}

	function pause(): void {
		paused = true;
	}

	function step(): void {
		animationState.prepareTick();
		renderFrame(0);
	}

	function restart(): void {
		pause();
		tickDelta = 0;
		animationState = new AnimationState(gameStore.fightEvents);
		renderFrame(0);
		play();
	}
</script>

<!-- @ts-ignore -->
<div class="outer horiz">
	<div class="column" style:flex="2" style:overflow="visible">
		<div class="viewport" bind:offsetWidth={frameWidth} bind:offsetHeight={frameHeight}>
			{#if loaded}
				<Application width={frameWidth} height={frameHeight} antialias={true}>
					<Ticker ontick={doTick} speed={(playbackSpeed || 0) / 1200} />
					<Container x={frameWidth / 2} y={frameHeight / 2} pivot={0.5} scale={cameraScale}>
						<Sprite
							texture={PIXI.Texture.from('/static/arena.png')}
							x={-cameraX - 25}
							y={-cameraY - 25}
							pivot={0.5}
							scale={0.1}
						/>
						{#each fighters as f, i}
							{#if f.hp > 0}
								<Container
									x={f.x - cameraX}
									y={f.y - cameraY}
									pivot={0.5}
									scale={[(15 / 384) * f.facing, 15 / 384]}
									angle={f.rotation}
									filters={getColorFilters(f.tint, f.flash)}
								>
									<!-- using height / width does not work on the first run and i have no idea why -->
									<FighterBattleSprite fighter={f} equipment={f.equipment} particles={fighterParticles[i]} />
								</Container>
							{/if}
						{/each}
						{#each particles as p}
							{#if p.type === 'projectile'}
								<Sprite
									texture={PIXI.Texture.from(p.imgUrl)}
									x={p.x - cameraX}
									y={p.y - cameraY}
									scale={15 / 384}
									anchor={0.5}
									zIndex={p.y}
									rotation={p.rotation}
								/>
							{:else if p.type === 'text'}
								<Text
									text={p.text}
									x={p.x - cameraX}
									y={p.y - cameraY}
									anchor={0.5}
									zIndex={1001}
									alpha={p.opacity}
									scale={1 / 16}
									style={{
										fill: 0xeeeeee,
										fontFamily: 'Comic Sans MS',
										fontSize: 32 // we do big text and then downscale it so it's not blurry
									}}
								/>
							{/if}
						{/each}
					</Container>
				</Application>
			{/if}
		</div>
	</div>
	<div class="column controls" style:flex="1">
		<div class="horiz controls-row">
			<button onclick={play} onsubmit={play}>Play</button>
			<button onclick={pause} onsubmit={pause}>Pause</button>
			<button onclick={restart} onsubmit={restart}>Rewind to beginning</button>
		</div>
		<div class="horiz controls-row">
			<label class="horiz"
				>Playback speed:
				<input type="number" min="0" max="1000" step="10" bind:value={playbackSpeed} />%
			</label>
		</div>
		{#if debug}
			<div class="horiz controls-row">
				<button onclick={step} onsubmit={step}>Step</button>
				<button onclick={enterEvents} onsubmit={enterEvents}>Enter events</button>
				<input type="text" bind:value={eventLogRaw} />
			</div>
		{/if}
		{#each fighters as fighter}
			{#if fighter.hp > 0}
				<FighterBattleInfo {fighter} />
			{/if}
		{/each}
	</div>
</div>

<style>
	.outer {
		flex: 1;
		padding: 2rem;
		justify-content: stretch;
		align-items: stretch;
	}

	.viewport {
		width: calc(100% - 4px);
		height: calc(100% - 4px);
		overflow: hidden;
		display: flex;
		justify-content: flex-start;
		align-items: flex-start;
		border: 2px solid var(--text-3);
		border-radius: 2rem;
		background-color: var(--text-3);
	}

	.controls {
		align-items: stretch;
	}

	input {
		flex-basis: 3rem;
	}

	.controls-row,
	label {
		justify-content: stretch;
		align-items: center;
	}

	.controls button:first-child,
	.controls button:last-child,
	.controls input:first-child,
	.controls input:last-child {
		flex-grow: 1;
		margin: 0.5rem 0;
	}

	.controls button,
	.controls input,
	label input {
		flex-grow: 1;
		margin: 0.5rem;
	}

	.column {
		margin: 0 1rem;
	}
</style>
