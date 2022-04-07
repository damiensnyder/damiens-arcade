<script lang="ts">
  import { Side } from "$lib/auction-tic-tac-toe/types";
  import PlayerJoiner from "$lib/auction-tic-tac-toe/player-joiner.svelte";
  import { host, lastAction, pov } from "$lib/stores";
  import { players } from "$lib/auction-tic-tac-toe/stores";

  $: canStartGame = $host === $pov &&
      $players.X.controller !== undefined &&
      $players.O.controller !== undefined;

  function startGame() {
    lastAction.set({
      type: "startGame"
    });
  }
</script>

<div class="outer">
  <div class="inner">
    <PlayerJoiner side={Side.X} />
    <PlayerJoiner side={Side.O} />
  </div>
  {#if canStartGame}
    <button class="big-button" on:submit={startGame} on:click={startGame}>
      START
    </button>
  {:else if $host === $pov}
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