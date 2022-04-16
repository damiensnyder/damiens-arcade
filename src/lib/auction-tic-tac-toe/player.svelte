<script lang="ts">
  import { lastAction, pov } from "$lib/stores";
  import X from "$lib/auction-tic-tac-toe/x.svelte";
  import O from "$lib/auction-tic-tac-toe/o.svelte";
  import { Side, TurnPart } from "$lib/auction-tic-tac-toe/types";
  import { oppositeSideOf } from "$lib/auction-tic-tac-toe/utils";
  import { players, settings, turnPart, whoseTurnToBid, whoseTurnToNominate } from "$lib/auction-tic-tac-toe/stores";

  export let side: Side;

  $: thisPlayersTurn = ($whoseTurnToNominate === side && $turnPart === TurnPart.Nominating) ||
      ($whoseTurnToBid === side && $turnPart === TurnPart.Bidding);
  
  // For example, converts 234567 to 3:54 (because 3m 54s ~ 234567 ms)
  function millisToMinutesAndSeconds(timeInMillis: number): string {
    const asDate = new Date(Date.UTC(0, 0, 0, 0, 0, timeInMillis));
    return `${asDate.getUTCMinutes()}:${String(asDate.getUTCSeconds()).padStart(2, "0")}`;
  }
  
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
  <span class="money" class:this-players-turn={thisPlayersTurn}>
    ${$players[side].money}
    {#if $settings.useTiebreaker}
      &nbsp;&bull;&nbsp;{millisToMinutesAndSeconds($players[side].timeUsed)}
    {/if}
  </span>
  {#if $pov === $players[side].controller}
    <span class="controller">(you)</span>
  {:else if $players[side].controller === undefined && $players[oppositeSideOf(side)].controller !== $pov}
    <button class="big-button" on:click={replace} on:submit={replace}>REPLACE</button>
  {:else if $players[side].controller === undefined}
    <span class="controller">(disconnected)</span>
  {/if}
</div>
  
<style>
  div {
    position: relative;
  }

  .money {
    font-size: 1.5rem;
    margin-top: 1rem;
  }

  button {
    position: absolute;
    bottom: -2rem;
  }

  .controller {
    position: absolute;
    bottom: -1.5rem;
    color: var(--text-4);
  }

  .this-players-turn {
    color: #ee6;
  }
</style>