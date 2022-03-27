<script lang="ts">
  import type { ActionCallback } from "$lib/types";
  import { Side } from "$lib/auction-tic-tac-toe/types";
  import type { AuctionTTTViewpoint } from "$lib/auction-tic-tac-toe/types";
  import PlayerJoiner from "./player-joiner.svelte";

  export let gamestate: AuctionTTTViewpoint;
  export let callback: ActionCallback;

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
  {#if gamestate.isHost && gamestate.players.length === 2}
    <button class="big-button" on:submit={startGame}>
      START
    </button>
  {:else if gamestate.isHost}
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