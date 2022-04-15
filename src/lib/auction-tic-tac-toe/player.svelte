<script lang="ts">
  import { lastAction, pov } from "$lib/stores";
  import X from "$lib/auction-tic-tac-toe/x.svelte";
  import O from "$lib/auction-tic-tac-toe/o.svelte";
  import { Side, TurnPart } from "$lib/auction-tic-tac-toe/types";
  import { oppositeSideOf } from "$lib/auction-tic-tac-toe/utils";
  import { players, turnPart, whoseTurnToBid, whoseTurnToNominate } from "$lib/auction-tic-tac-toe/stores";

  export let side: Side;
  
  function replace() {
    lastAction.set({
      type: "join",
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
  <span class:this-players-turn={($whoseTurnToNominate === side && $turnPart === TurnPart.Nominating) ||
                                 ($whoseTurnToBid === side && $turnPart === TurnPart.Bidding)}>
    ${$players[side].money}
  </span>
  {#if $pov === $players[side].controller}
    <div class="you">(you)</div>
  {:else if $players[side].controller === undefined && $players[oppositeSideOf(side)].controller !== $pov}
    <button class="big-button" on:click={replace} on:submit={replace}>REPLACE</button>
  {/if}
</div>
  
<style>
  div {
    position: relative;
  }

  span {
    font-size: 1.5rem;
    margin-top: 1rem;
  }

  .you {
    position: absolute;
    bottom: -1.5rem;
    color: var(--text-4);
  }

  .this-players-turn {
    color: #ee6;
  }
</style>