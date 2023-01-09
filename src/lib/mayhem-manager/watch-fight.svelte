<script lang="ts">
  import type { FighterInBattle, MidFightEvent } from "$lib/mayhem-manager/types";
  import { fightEvents } from "$lib/mayhem-manager/stores";
  import FighterImage from "$lib/mayhem-manager/fighter-image.svelte";
  import FighterBattleInfo from "$lib/mayhem-manager/fighter-battle-info.svelte";
  import { fade } from "svelte/transition";

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
  let cameraScale: number = 0.7;
  let cameraTransformX: number = 0;
  let cameraTransformY: number = 0;
  let frameWidth: number;
  let frameHeight: number;

  const BUFFER_PIXELS = 50;

  if (!debug) {
    play();
  }

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

  // Set camera transform so all fighters are visible but the camera is as zoomed as possible
  function setCamera(): void {
    if (fighters.length === 0) {
      cameraScale = 0.7;
      cameraTransformX = 0;
      cameraTransformY = 0;
      return;
    }
    let left: number, right: number, top: number, bottom: number;
    for (const f of fighters) {
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
    const frameAspectRatio = frameWidth / frameHeight;
    const contentAspectRatio = (right - left + BUFFER_PIXELS * 0.5) / (bottom - top + BUFFER_PIXELS);
    // if content has wider aspect ratio than the frame, set the zoom based on width
    // if taller, set based on height
    if (contentAspectRatio > frameAspectRatio) {
      cameraScale = 100 / (right - left + BUFFER_PIXELS * 0.5);
    } else {
      cameraScale = 100 / (bottom - top + BUFFER_PIXELS);
    }
    cameraTransformX = -(right + left - 100) / 2;
    cameraTransformY = -(bottom + top - 100) / 2;
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
    console.debug("Event in tick " + tick + ":");
    console.debug(event);
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
  <div class="camera-outer" bind:offsetWidth={frameWidth} bind:offsetHeight={frameHeight}>
    <div class="camera-inner"
        style:transform={`scale(${cameraScale}) translate(${cameraTransformX}%, ${cameraTransformY}%)`}>
      <div class="arena">
        {#each fighters as f, i}
          {#if f.hp > 0}
            <div class="fighter"
                style:transform={`translate(${f.x * 10}px, ${f.y * 10}px) rotate(${rotation[i]})`}
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
                  style:left={(f.x).toFixed(2) + "%"}
                  style:top={(f.y - 8).toFixed(2) + "%"}
                  out:fade="{{duration: 400}}">
                {p.text}
              </div>
            {/if}
          {/if}
        {/each}
      </div>
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
      <p>Last event: {lastEvent}</p> -->
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

  .camera-outer {
    width: 65%;
    margin: 0 1.25rem;
    overflow: hidden;
    height: 75vh;
    display: flex;
    justify-content: center;
    align-items: center;
    border: 2px solid var(--text-3);
    border-radius: 2rem;
    background-color: var(--text-3);
  }

  .camera-inner {
    will-change: transform;
    transform-origin: center center;
    transition: all 1s ease-in-out;
  }
  
  .arena {
    position: relative;
    width: 1000px;
    height: 1000px;
    background-color: var(--bg-2);
  }

  .fighter {
    will-change: transform;
    position: absolute;
    top: -75px;
    left: -75px;
    width: 150px;
    height: 150px;
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