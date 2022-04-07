<script lang="ts">
  import { lastAction, pov } from "$lib/stores";
  import X from "$lib/auction-tic-tac-toe/x.svelte";
  import O from "$lib/auction-tic-tac-toe/o.svelte";
  import { Side } from "$lib/auction-tic-tac-toe/types";
  import { getSideByController } from "$lib/auction-tic-tac-toe/utils";
  import { players } from "$lib/auction-tic-tac-toe/stores";

  export let side: Side;

  $: ownPlayer = $players[getSideByController($players, $pov)];
  
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
  <span>${ownPlayer.money}</span>
  {#if $players[side].controller === undefined && ownPlayer === Side.None}
    <button class="big-button" on:click={replace} on:submit={replace}>REPLACE</button>
  {/if}
</div>
  
<style>
  span {
    font-size: 1.5rem;
    margin-top: 1rem;
  }
</style>