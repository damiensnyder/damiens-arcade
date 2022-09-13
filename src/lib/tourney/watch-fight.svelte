<script lang="ts">
  import type { FighterInBattle, MidFightEvent } from "$lib/tourney/types";
  import FighterImage from "$lib/tourney/fighter-image.svelte";
  import FighterBattleInfo from "$lib/tourney/fighter-battle-info.svelte";
  import { fade } from "svelte/transition";

  let eventLogRaw: string = "";
  let eventLog: MidFightEvent[][] = [];
  let fighters: FighterInBattle[] = [];
  let rotation: AnimationState[] = [];
  let flipped: boolean[] = [];
  let particles: Particle[] = [];
  let tick: number = 0;
  let tickInterval = null;
  let lastEvent: string = "";
  let tickLength: number = 200;  // ticks are 0.2 s long

  type Particle = {
    fighter: number
    type: "text"
    text: string
    ticksUntil: number
  };

  enum AnimationState {
    Stationary1 = "0deg",
    Stationary2 = "0deg ",
    WalkingStart1 = "-15deg ",
    Walking1 = "-15deg",
    WalkingStart2 = "15deg ",
    Walking2 = "15deg",
    BackswingStart = "-10deg ",
    Backswing = "-10deg",
    ForwardSwing = "30deg"
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
      particles.forEach((p) => {
        p.ticksUntil--;
      });
      particles = particles.filter(p => p.ticksUntil >= 0);
    } else {
      clearInterval(tickInterval);
    }
  }
  
  function restart(): void {
    clearInterval(tickInterval);
    fighters = [];
    rotation = [];
    flipped = [];
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
  <div class="arena">
    {#each fighters as f, i}
      {#if f.hp > 0}
        <div class="fighter"
            style:left={(f.x - 7.5).toFixed(2) + "%"}
            style:top={(f.y - 7.5).toFixed(2) + "%"}
            style:transform={`rotate(${rotation[i]})`}>
          <FighterImage fighter={f} equipment={f.equipment} inBattle={true} />
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
  <div class="controls">
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
    align-items: flex-start;
  }

  .arena {
    position: relative;
    border: 2px solid var(--text-fun-3);
    border-radius: 20%;
    background-color: var(--bg-fun-2);
    flex: 2;
    margin-right: 2rem;
    aspect-ratio: 1;
  }

  .fighter {
    position: absolute;
    width: 15%;
    height: 15%;

    transition: all 0.2s ease-in-out;
  }

  .controls {
    flex: 1;
  }

  .text-particle {
    position: absolute;
    text-align: center;
    width: 0;
    color: var(--text-fun-1);
  }

  /* p {
    width: 100%;
    overflow-x: hidden;
    white-space: normal;
    word-wrap: break-word;
  } */
</style>