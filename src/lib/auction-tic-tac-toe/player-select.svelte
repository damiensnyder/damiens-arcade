<script lang="ts">
  import { Side } from "$lib/auction-tic-tac-toe/types";
  import PregamePlayer from "$lib/auction-tic-tac-toe/pregame-player.svelte";
  import { host, lastAction, pov } from "$lib/stores";
  import { players } from "$lib/auction-tic-tac-toe/stores";

  $: canStartGame = $host === $pov &&
      $players.X.controller !== undefined &&
      $players.O.controller !== undefined;

  function startGame() {
    lastAction.set({
      type: "start"
    });
  }
</script>

<div class="outer">
  <div class="inner">
    <PregamePlayer side={Side.X} />
    <PregamePlayer side={Side.O} />
  </div>
  {#if canStartGame}
    <button on:submit={startGame} on:click={startGame}>
      START
    </button>
  {:else if $host === $pov}
    <button disabled>
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