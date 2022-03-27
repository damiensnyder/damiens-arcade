<script lang="ts">
  import type { ActionCallback } from "$lib/types";
  import { Side } from "$lib/auction-tic-tac-toe/types";
  import type { PregameViewpoint } from "$lib/auction-tic-tac-toe/types";
  import PlayerJoiner from "./player-joiner.svelte";

  export let gamestate: PregameViewpoint;
  export let callback: ActionCallback;

  $: canStartGame = gamestate.host === gamestate.pov &&
      gamestate.players.every((player) => {
    return player.controller !== undefined;
  })

  function startGame() {
    callback({
      type: "startGame"
    });
  }
</script>

<div class="outer">
  <div class="inner">
    <PlayerJoiner gamestate={gamestate} callback={callback} side={Side.X} />
    <PlayerJoiner gamestate={gamestate} callback={callback} side={Side.O} />
  </div>
  {#if canStartGame}
    <button class="big-button" on:submit={startGame} on:click={startGame}>
      START
    </button>
  {:else if gamestate.host === gamestate.pov}
    <button class="big-button" disabled>
      START
    </button>
  {/if}
</div>

<style>
  .outer {
    align-self: stretch;
    padding-left: 2rem;
    margin-left: 2.5rem;
    border-left: 2px solid var(--text-1);
  }

  .inner {
    flex: 1;
    justify-content: space-evenly;
  }

  button {
    justify-self: flex-end;
    margin-bottom: 0;
  }
</style>