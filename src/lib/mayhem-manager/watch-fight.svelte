<script lang="ts">
  import type { FighterInBattle, MidFightEvent } from "$lib/mayhem-manager/types";
  import { fightEvents } from "$lib/mayhem-manager/stores";
  import FighterImage from "$lib/mayhem-manager/fighter-image.svelte";
  import FighterBattleInfo from "$lib/mayhem-manager/fighter-battle-info.svelte";
  import { fade } from "svelte/transition";
  import { onMount } from "svelte";

  
  const BUFFER_PIXELS = 8;

  export let debug: boolean = true;
  let eventLogRaw: string = "";
  let eventLog: MidFightEvent[][] = debug ? [] : $fightEvents;
  let fighters: FighterInBattle[] = [];
  let rotation: AnimationState[] = [];
  let flipped: boolean[] = [];
  let hitFlashIntensity: number[] = [];
  let particles: Particle[] = [];
  let tick: number = 0;
  let tickInterval = null;
  let lastEvent: string = "";
  let tickLength: number = 200;  // ticks are 0.2 s long
  let frameWidth: number;
  let frameHeight: number;
  let zoom: number = 7;
  let leftCoord: number = 25 - BUFFER_PIXELS;
  let topCoord: number = 25 - BUFFER_PIXELS;

  onMount(() => {
    if (!debug) {
      play();
    } else {
      setCamera(1);
    }
  });

  type Particle = {
    fighter: number
    type: "text"
    text: string
    ticksUntil: number
  };

  enum AnimationState {
    Stationary1 = "0deg",
    Stationary2 = "0deg ",
    WalkingStart1 = "-10deg ",
    Walking1 = "-10deg",
    WalkingStart2 = "10deg ",
    Walking2 = "10deg",
    BackswingStart = "-11deg ",
    Backswing = "-11deg",
    ForwardSwing = "30deg"
  }

  // Set camera transform so all fighters are visible but the camera is as zoomed as possible.
  // Camera should be centered, and the outermost fighters should be BUFFER_PIXELS from the
  // edge of the camera.
  // Moves gradually towards the desired position (at a default speed of 10% per tick).
  function setCamera(speed: number = 0.1): void {
    const frameAspectRatio = frameWidth / frameHeight;
    console.log(frameWidth, frameHeight);
    let newLeftCoord: number, newTopCoord: number, newZoom: number;
    if (fighters.filter(f => f.hp > 0).length === 0) {
      if (frameAspectRatio < 1) {
        newZoom = frameWidth / (50 + 2 * BUFFER_PIXELS);
        newLeftCoord = 25 - BUFFER_PIXELS;
        newTopCoord = 50 - (25 + BUFFER_PIXELS) / frameAspectRatio;
      } else {
        newZoom = frameHeight / (50 + 2 * BUFFER_PIXELS);
        console.log(frameAspectRatio);
        newLeftCoord = 50 - (25 + BUFFER_PIXELS) * frameAspectRatio;
        newTopCoord = 25 - BUFFER_PIXELS;
      }
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
        newZoom = frameWidth / (right - left + 2 * BUFFER_PIXELS);
        newLeftCoord = left - BUFFER_PIXELS;
        newTopCoord = (top + bottom - (right - left + 2 * BUFFER_PIXELS) / frameAspectRatio) / 2;
      } else {
        newZoom = frameHeight / (bottom - top + 2 * BUFFER_PIXELS);
        newLeftCoord = (right + left - (bottom - top + 2 * BUFFER_PIXELS) * frameAspectRatio) / 2;
        newTopCoord = top - BUFFER_PIXELS;
      }
    }

    // update camera based on speed; 10% moves camera 10% of the way to desired position,
    // 100% moves all the way, 0% doesn't move at all.
    zoom = zoom * (1 - speed) + newZoom * speed;
    leftCoord = leftCoord * (1 - speed) + newLeftCoord * speed;
    topCoord = topCoord * (1 - speed) + newTopCoord * speed;
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
    tickInterval = setInterval(step, tickLength);
  }
  
  function pause(): void {
    clearInterval(tickInterval);
  }
  
  function step(): void {
    if (tick < eventLog.length) {
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
      particles.forEach((p) => {
        p.ticksUntil--;
        if (p.type === "text" &&
            p.text !== "Dodged" &&
            p.ticksUntil === 0) {
          hitFlashIntensity[p.fighter] = 1;
        }
      });
      particles = particles.filter(p => p.ticksUntil >= 0);
    } else {
      clearInterval(tickInterval);
    }
    setCamera();
  }
  
  function restart(): void {
    clearInterval(tickInterval);
    fighters = [];
    rotation = [];
    flipped = [];
    hitFlashIntensity = []
    tick = 0;
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
      particles.push({
        fighter: event.target,
        type: "text",
        text: event.dodged ? "Dodged" : event.damage.toString(),
        ticksUntil: 1
      })
    }
    lastEvent = JSON.stringify(fighters);
  }
</script>

<div class="outer horiz">
  <div class="viewport" bind:offsetWidth={frameWidth} bind:offsetHeight={frameHeight}>
    <div class="background"
        style:transform={`scale(${zoom}) translate3d(${42 - leftCoord}px, ${42 - topCoord}px, 0)`}>
    </div>
    <div class="arena">
      {#each fighters as f, i}
        {#if f.hp > 0}
          <div class="fighter"
              style:transform={`scale(${zoom}) translate3d(${(f.x - leftCoord)}px, ${(f.y - topCoord)}px, 0) rotate(${rotation[i]})`}
              style:filter={`sepia(${hitFlashIntensity[i] / 2}) brightness(${1 + hitFlashIntensity[i]})`}
              style:z-index={10 * f.y}>
            <FighterImage fighter={f} equipment={f.equipment} inBattle={true} team={f.team} />
          </div>
        {/if}
      {/each}

      {#each particles as p}
        {#if p.ticksUntil === 0}
          {@const f = fighters[p.fighter]}
          {#if p.type === "text"}
            <div class="text-particle"
                style:transform={`scale(${zoom / 10}) translate3d(${(f.x - leftCoord) * 10}px, ${(f.y - topCoord) * 10 - 65}px, 0)`}
                out:fade="{{duration: 400}}">
              {p.text}
            </div>
          {/if}
        {/if}
      {/each}
    </div>
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
    /* image-rendering: pixelated;  i thought this would improve performance but it didn't */
    border: 2px solid var(--text-3);
    border-radius: 2rem;
    background-color: var(--text-3);
  }

  .background {
    will-change: transform;
    backface-visibility: hidden;
    position: absolute;
    transform-origin: center center;
    transition: all 0.2s ease-in-out;
    top: 0;
    left: 0;
    width: 100px;
    height: 100px;
    background-color: var(--bg-2);
  }
  
  .arena {
    position: relative;
  }

  .fighter {
    will-change: transform;
    backface-visibility: hidden;
    position: absolute;
    top: 0;
    left: 0;
    width: 15px;
    height: 15px;
    transform-origin: center center;

    transition: all 0.2s ease-in-out, filter 0s ease;
  }

  .controls {
    flex: 1;
  }

  .text-particle {
    position: absolute;
    text-align: center;
    width: 0;
    top: 0;
    left: 0;
    font-size: 15px;
    color: var(--text-1);
    z-index: 1500;
  }

  /* p {
    width: 100%;
    overflow-x: hidden;
    white-space: normal;
    word-wrap: break-word;
  } */
</style>