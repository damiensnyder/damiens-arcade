<script lang="ts">
  import type { FighterInBattle, MidFightEvent } from "$lib/mayhem-manager/types";
  import { fightEvents } from "$lib/mayhem-manager/stores";
  import FighterBattleInfo from "$lib/mayhem-manager/fighter-battle-info.svelte";
  import { onMount } from "svelte";
  import { Application, Container, Graphics, onTick, Ticker } from "svelte-pixi";
  import FighterBattleSprite from "$lib/mayhem-manager/fighter-battle-sprite.svelte";

  const BUFFER_PIXELS = 15;

  export let debug: boolean = true;
  let eventLogRaw: string = "";
  let eventLog: MidFightEvent[][] = debug ? [] : $fightEvents;
  let fighters: FighterInBattle[] = [];
  let rotation: AnimationState[] = [];
  let flipped: boolean[] = [];
  let hitFlashIntensity: number[] = [];
  // let particles: Particle[] = [];
  let tick: number = 0;
  // let lastEvent: string = "";
  let tickLength: number = 200;  // ticks are 0.2 s long
  let frameWidth: number;
  let frameHeight: number;
  let cameraScale: number = 7;
  let cameraX: number = 0;
  let cameraY: number = 50;
  let timeSinceLastRender: number = 0;
  let paused: boolean = true;

  /*type Particle = {
    type: "text"
    fighter: number
    text: string
    ticksUntil: number
  } | {
    type: "projectile"
    fighter: number
    target: number
    imgUrl: string
  };*/

  enum AnimationState {
    Stationary1 = 0,
    Stationary2 = 0.1,
    WalkingStart1 = -10,
    Walking1 = -10.1,
    WalkingStart2 = 10,
    Walking2 = 10.1,
    BackswingStart = -11.1,
    Backswing = -11,
    ForwardSwing = 30
  }

  onMount(() => {
    if (!debug) {
      play();
    } else {
      setCamera();
    }
  });

  function doTick(e: CustomEvent) {
    const delta = e.detail;
    timeSinceLastRender += delta;
    if (tick < eventLog.length &&
        !paused &&
        timeSinceLastRender >= 1) {
      renderFrame();
      tick++;
      timeSinceLastRender -= 1;
    }
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
      tick = 0;
    } catch (e) {
      window.alert("Error: Could not parse events.");
    }
  }
  
  function play(): void {
    timeSinceLastRender = 0;
    paused = false;
    setCamera();
  }
  
  function pause(): void {
    paused = true;
  }

  function step(): void {
    if (tick < eventLog.length) {
      renderFrame();
      tick++;
    }
  }

  function renderFrame(): void {
    eventLog[tick].forEach(handleEvent);
    tick++;
    rotation = rotation.map((prev) => {
      if (prev === AnimationState.Backswing) {
        return AnimationState.ForwardSwing;
      } else if (prev === AnimationState.BackswingStart) {
        return AnimationState.Backswing;
      } else if (prev === AnimationState.WalkingStart1) {
        return AnimationState.Walking1;
      } else if (prev === AnimationState.WalkingStart2) {
        return AnimationState.Walking2;
      } else if (prev === AnimationState.Walking1) {
        return AnimationState.Stationary2;
      } else {
        return AnimationState.Stationary1;
      }
    });
    hitFlashIntensity = hitFlashIntensity.map(x => x / 4);
    /*particles.forEach((p) => {
      p.ticksUntil--;
      if (p.type === "text" &&
          p.text !== "Dodged" &&
          p.ticksUntil === 0) {
        hitFlashIntensity[p.fighter] = 1;
      }
    });
    particles = particles.filter(p => p.ticksUntil >= 0);*/
    setCamera();
  }
  
  function restart(): void {
    pause();
    fighters = [];
    rotation = [];
    flipped = [];
    hitFlashIntensity = [];
    tick = 0;
    timeSinceLastRender = 0;
    renderFrame();
    play();
  }

  function handleEvent(event: MidFightEvent): void {
    // console.debug("Event in tick " + tick + ":");
    // console.debug(event);
    if (event.type === "spawn") {
      fighters.push(event.fighter);
      fighters = fighters;
      rotation.push(AnimationState.Stationary1);
      rotation = rotation;
      flipped.push(false);
      hitFlashIntensity.push(0);
    } else if (event.type === "move") {
      // make them face the direction they are going
      flipped[event.fighter] = fighters[event.fighter].x < event.x;

      // move them to their new coordinates
      fighters[event.fighter].x = event.x;
      fighters[event.fighter].y = event.y;

      // update their rotation
      if (rotation[event.fighter] !== AnimationState.Stationary2 &&
          rotation[event.fighter] !== AnimationState.Walking1 &&
          rotation[event.fighter] !== AnimationState.Walking2) {
        rotation[event.fighter] = AnimationState.WalkingStart1;
      } else if (rotation[event.fighter] === AnimationState.Stationary2) {
        rotation[event.fighter] = AnimationState.WalkingStart2;
      }
    } else if (event.type === "meleeAttack") {
      fighters[event.target].hp -= event.damage;
      rotation[event.fighter] = AnimationState.BackswingStart;
      /* particles.push({
        fighter: event.target,
        type: "text",
        text: event.dodged ? "Dodged" : event.damage.toString(),
        ticksUntil: 1
      }) */
    }
    // lastEvent = JSON.stringify(fighters);
  }
</script>

<div class="outer horiz">
  <div class="viewport" bind:offsetWidth={frameWidth} bind:offsetHeight={frameHeight}>
    <Application width={frameWidth} height={frameHeight}>
      <Ticker on:tick={doTick} speed={(1000 / 60) / tickLength} />
      <Container x={frameWidth / 2} y={frameHeight / 2} pivot={0.5} scale={cameraScale}>
        <Graphics x={-cameraX} y={-cameraY} pivot={0.5} draw={(graphics) => {
          graphics.clear();
          graphics.beginFill(0x555555);
          graphics.drawRect(0, 0, 100, 100);
        }} />
        {#each fighters as f, i}
          <Container x={f.x - cameraX} y={f.y - cameraY} width={15} height={15} zIndex={f.y} pivot={0.5} angle={rotation[i]} visible={f.hp > 0}>
            <FighterBattleSprite fighter={f} equipment={f.equipment} />
          </Container>
        {/each}
      </Container>
    </Application>
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