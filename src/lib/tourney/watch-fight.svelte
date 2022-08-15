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
  let eventInterval = null;
  let lastEvent: string = "";
  let slowdown: number = 1;

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
    } catch (e) {
      window.alert("you done messed up");
    }
  }

  function play(): void {
    tickInterval = setInterval(() => {
      if (tick < eventLog.length) {
        let i = 0;
        eventInterval = setInterval(() => {
          if (i < eventLog[tick].length) {
            handleEvent(eventLog[tick][i], i);
          }
          i++;
          if (i === eventLog[tick].length) {
            clearInterval(eventInterval);
          }
        }, 200 / eventLog[tick].length * slowdown);
        tick++;
      } else {
        clearInterval(tickInterval);
      }
    }, 200 * slowdown);
  }

  function pause(): void {
    clearInterval(tickInterval);
  }

  function restart(): void {
    clearInterval(tickInterval);
    clearInterval(eventInterval);
    fighters = [];
    rotation = [];
    flipped = [];
    tick = 0;
    play();
  }

  function handleEvent(event: MidFightEvent, _i: number): void {
    if (event.type === "spawn") {
      if (tick > 1) {
        window.alert(lastEvent);
      }
      fighters.push(event.fighter);
      rotation.push(AnimationState.Stationary);
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
  <div class="controls">
    <button on:click={play} on:submit={play}>Play</button>
    <button on:click={pause} on:submit={pause}>Pause</button>
    <button on:click={restart} on:submit={restart}>Restart</button>
    <button on:click={enterEvents} on:submit={enterEvents}>Enter events</button>
    <textarea rows={1} bind:value={eventLogRaw}></textarea>
    <label>Slowdown
      <input type="range" min="1" max="50" bind:value={slowdown} />
    </label>
    <p>{lastEvent}</p>
  </div>
  <div class="arena">
    {#each fighters as f, i}
      <div class="fighter"
          style:left={(f.x + 50).toFixed(2) + "%"}
          style:top={(f.y + 50).toFixed(2) + "%"}
          style:transform={`rotate(${rotation[i]})`}>
        <FighterImage fighter={f} equipment={f.equipment} />
      </div>
    {/each}
  </div>
</div>

<style>
  .outer {
    flex: 1;
    padding: 2rem;
    justify-content: space-between;
    align-items: flex-start;
  }

  .arena {
    position: relative;
    border: 2px solid var(--text-fun-3);
    border-radius: 50%;
    background-color: var(--bg-fun-2);
    width: 75vh;
    min-width: 75vh;
    height: 75vh;
    min-height: 75vh;
  }

  .fighter {
    position: absolute;
    width: 5%;
    height: 5%;
  }

  p {
    max-width: 50%;
    white-space: normal;
    word-wrap: break-word;
  }
</style>