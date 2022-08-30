<script lang="ts">
  import type { FighterInBattle, MidFightEvent } from "$lib/tourney/types";
  import FighterImage from "$lib/tourney/fighter-image.svelte";

  let eventLogRaw: string = "";
  let eventLog: MidFightEvent[][] = [];
  let fighters: FighterInBattle[] = [];
  let rotation: AnimationState[] = [];
  let flipped: AnimationState[] = [];
  let tick: number = 0;
  let tickInterval = null;
  let lastEvent: string = "";
  let tickLength: number = 200;

  enum AnimationState {
    Stationary = "0deg",
    StepLeft = "-15deg",
    StepRight = "-15deg",
    BackSwing = "-30deg",
    ForwardSwing = "20deg"
  }

  function enterEvents(): void {
    try {
      eventLog = JSON.parse("[" + eventLogRaw.replaceAll("][", "],[") + "]");
      tick = 0;
    } catch (e) {
      window.alert("you done messed up");
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
      /* const processNextEvent = (i) => {
        handleEvent(eventLog[tick][i]);
        if (i + 1 < eventLog[tick].length) {
          setTimeout(() => processNextEvent(i + 1), tickLength / eventLog[tick].length);
        } else {
          console.debug(i + 1);
          console.debug(eventLog[tick]);
        }
      };
      if (eventLog[tick].length > 0) {
        processNextEvent(0);
      } */
      
      tick++;
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
      rotation.push(AnimationState.Stationary);
      rotation = rotation;
    } else if (event.type === "move") {
      fighters[event.fighter].x = event.x;
      fighters[event.fighter].y = event.y;
    } else if (event.type === "meleeAttack") {
      // figure this out later
    }
    lastEvent = JSON.stringify(fighters);
  }
</script>

<div class="outer horiz">
  <div class="arena">
    {#each fighters as f, i}
      <div class="fighter"
          style:left={(f.x + 42.5).toFixed(2) + "%"}
          style:top={(f.y + 42.5).toFixed(2) + "%"}
          style:transform={`rotate(${rotation[i]})`}>
        <FighterImage fighter={f} equipment={f.equipment} inBattle={true} />
      </div>
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
    {#each fighters as f}
      <div>{f.name}</div>
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
    overflow-x: hidden;
    overflow-y: scroll;
  }

  p {
    width: 100%;
    overflow-x: hidden;
    white-space: normal;
    word-wrap: break-word;
  }
</style>