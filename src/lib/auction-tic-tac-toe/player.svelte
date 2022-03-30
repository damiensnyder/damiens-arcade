<script lang="ts">
  import { gamestate, lastAction } from "$lib/stores";
  import X from "$lib/auction-tic-tac-toe/x.svelte";
  import O from "$lib/auction-tic-tac-toe/o.svelte";
  import { Side, type MidgameViewpoint } from "$lib/auction-tic-tac-toe/types";
  import { getPlayerByController, getPlayerBySide } from "$lib/auction-tic-tac-toe/utils";

  export let side: Side;

  $: gs = $gamestate as MidgameViewpoint;
  $: thisPlayer = getPlayerBySide(gs.players, side);
  $: ownPlayer = getPlayerByController(gs.players, gs.pov);

  function replace() {
    lastAction.set({
      type: "replacePlayer",
      side: side
    });
  }
</script>

<div>
  {#if side === Side.X}
    <X size={120} />
  {:else}
    <O size={120} />
  {/if}
  <span>${thisPlayer.money}</span>
  {#if thisPlayer.controller === undefined && ownPlayer === null}
    <button class="big-button" on:click={replace} on:submit={replace}>REPLACE</button>
  {/if}
</div>
  
<style>
  span {
    font-size: 1.5rem;
    margin-top: 1rem;
  }
</style>