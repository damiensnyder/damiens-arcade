<script lang="ts">
  import type { FighterInBattle, MidFightEvent } from "$lib/mayhem-manager/types";
  import { fightEvents } from "$lib/mayhem-manager/stores";
  import FighterBattleInfo from "$lib/mayhem-manager/fighter-battle-info.svelte";
  import { onMount } from "svelte";
  import { Application, Container, Graphics, onTick, Sprite, Text, Ticker } from "svelte-pixi";
  import FighterBattleSprite from "$lib/mayhem-manager/fighter-battle-sprite.svelte";
  import AnimationState, { type Particle } from "$lib/mayhem-manager/animation-state";
  import * as PIXI from "pixi.js";

  const BUFFER_PIXELS = 15;

  export let debug: boolean = true;
  let eventLogRaw: string = "";
  let eventLog: MidFightEvent[][] = debug ? [] : $fightEvents;
  $: animationState = new AnimationState(eventLog);
  let fighters: FighterInBattle[] = [];
  let rotation: number[] = [];
  let flipped: number[] = [];
  let hitFlashIntensity: number[] = [];
  let particles: Particle[] = [];
  // let lastEvent: string = "";
  let tickLength: number = 200;  // ticks are 0.2 s long
  let frameWidth: number;
  let frameHeight: number;
  let cameraScale: number = 7;
  let cameraX: number = 0;
  let cameraY: number = 50;
  let tickDelta: number = 0;
  let paused: boolean = true;
  let loaded: boolean = false;  // keeps pixi canvas from existing before its size is known

  onMount(() => {
    loaded = true;
    if (!debug) {
      play();
    } else {
      setCamera();
    }
  });

  function doTick(e: CustomEvent) {
    const delta = e.detail;
    if (!paused) {
      tickDelta += delta;
      if (tickDelta > 1) {
        animationState.prepareTick();
        tickDelta -= 1;
      }
      renderFrame();
    }
  }

  function renderFrame(): void {
    fighters = animationState.getFighters(tickDelta);
    rotation = animationState.getRotation(tickDelta);
    flipped = animationState.getFlipped(tickDelta);
    hitFlashIntensity = animationState.getHitFlashIntensity(tickDelta);
    particles = animationState.getParticles(tickDelta);
    setCamera();
  }

  // Set camera transform so all fighters are visible but the camera is as zoomed as possible.
  // Camera should be centered, and the outermost fighters should be BUFFER_PIXELS from the
  // edge of the camera.
  function setCamera(): void {
    const frameAspectRatio = frameWidth / frameHeight;
    if (fighters.filter(f => f.hp > 0).length === 0) {
      if (frameAspectRatio < 1) {
        cameraScale = frameWidth / (50 + 2 * BUFFER_PIXELS);
      } else {
        cameraScale = frameHeight / (50 + 2 * BUFFER_PIXELS);
      }
      cameraX = 50;
      cameraY = 50;
    } else {
      // find the leftmost, rightmost, topmost, and bottommost coordinates a fighter has
      let left: number, right: number, top: number, bottom: number;
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
      const contentAspectRatio = (right - left + 2 * BUFFER_PIXELS) / (bottom - top + 2 * BUFFER_PIXELS);
      // if content has wider aspect ratio than the frame, set the zoom based on width
      // if taller, set based on height
      if (frameAspectRatio < contentAspectRatio) {
        cameraScale = frameWidth / (right - left + 2 * BUFFER_PIXELS);
      } else {
        cameraScale = frameHeight / (bottom - top + 2 * BUFFER_PIXELS);
      }
      cameraX = (right + left) / 2;
      cameraY = (top + bottom) / 2;
    }
  }

  function enterEvents(): void {
    try {
      eventLog = JSON.parse("[" + eventLogRaw.replaceAll("][", "],[") + "]");
    } catch (e) {
      window.alert("Error: Could not parse events.");
    }
  }
  
  function play(): void {
    tickDelta = 0;
    paused = false;
    setCamera();
  }
  
  function pause(): void {
    paused = true;
  }

  function step(): void {
    animationState.prepareTick();
    renderFrame();
  }
  
  function restart(): void {
    pause();
    tickDelta = 0;
    animationState = new AnimationState(eventLog);
    renderFrame();
    play();
  }
</script>

<div class="outer horiz">
  <div class="viewport" bind:offsetWidth={frameWidth} bind:offsetHeight={frameHeight}>
    {#if loaded}
      <Application width={frameWidth} height={frameHeight} antialias={true}>
        <Ticker on:tick={doTick} speed={(1000 / 60) / tickLength} />
        <Container x={frameWidth / 2} y={frameHeight / 2} pivot={0.5} scale={cameraScale}>
          <Graphics x={-cameraX} y={-cameraY} pivot={0.5} draw={(graphics) => {
            graphics.clear();
            graphics.beginFill(0x555555);
            graphics.drawRect(0, 0, 100, 100);
          }} />
          {#each fighters as f, i}
            {#if f.hp > 0}
              <Container x={f.x - cameraX} y={f.y - cameraY} width={15} height={15} zIndex={f.y} pivot={0.5} angle={rotation[i]}>
                <FighterBattleSprite fighter={f} equipment={f.equipment} />
              </Container>
            {/if}
          {/each}
          {#each particles as p}
            {#if p.type === "image"}
              <Sprite texture={PIXI.Texture.from(p.imgUrl)}
                  x={p.x - cameraX} y={p.y - cameraY} height={15} width={15} anchor={0.5} zIndex={p.y} rotation={p.rotation} />
            {:else}
              <Text text={p.text} x={p.x - cameraX} y={p.y - cameraY} anchor={0.5} zIndex={1001} alpha={p.opacity} scale={1/16} style={{
                fill: 0xeeeeee,
                fontFamily: "Comic Sans MS",
                fontSize: 32  // we do big text and then downscale it so it's not blurry
              }} />
            {/if}
          {/each}
        </Container>
      </Application>
    {/if}
  </div>
  <div class="controls">
    {#if debug}
      <div class="horiz">
        <button on:click={play} on:submit={play}>Play</button>
        <button on:click={pause} on:submit={pause}>Pause</button>
      </div>
      <div class="horiz">
        <button on:click={step} on:submit={step}>Step</button>
        <button on:click={restart} on:submit={restart}>Restart</button>
      </div>
      <div class="horiz">
        <button on:click={enterEvents} on:submit={enterEvents}>Enter events</button>
        <textarea rows={1} bind:value={eventLogRaw}></textarea>
      </div>
      <!-- <label>Tick length
        <input type="range" min="100" max="5000" bind:value={tickLength} />
      </label>
      <p>Tick: {@debug tick}</p>
      <p>Fighters: {@debug fighters}</p>
      <p>Last event: {lastEvent}</p>
      <p>{@debug leftCoord, topCoord, zoom, frameWidth, frameHeight}</p> -->
    {/if}
    {#each fighters as fighter}
      <FighterBattleInfo {fighter} />
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
    width: 65%;
    margin: 0 1.25rem;
    overflow: hidden;
    height: 75vh;
    display: flex;
    justify-content: flex-start;
    align-items: flex-start;
    border: 2px solid var(--text-3);
    border-radius: 2rem;
    background-color: var(--text-3);
  }

  .controls {
    flex: 1;
  }

  /* p {
    width: 100%;
    overflow-x: hidden;
    white-space: normal;
    word-wrap: break-word;
  } */
</style>