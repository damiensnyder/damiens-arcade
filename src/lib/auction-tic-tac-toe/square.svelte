<script lang="ts">
  import { gamestate, lastAction } from "$lib/stores";
  import { Side } from "$lib/auction-tic-tac-toe/types";
  import type { MidgameViewpoint } from "$lib/auction-tic-tac-toe/types";
  import X from "$lib/auction-tic-tac-toe/x.svelte";
  import O from "$lib/auction-tic-tac-toe/o.svelte";
  import { getPlayerByController } from "$lib/auction-tic-tac-toe/utils";

  export let x: number;
  export let y: number;

  let bidAmount: number = 0;
  
  $: gs = $gamestate as MidgameViewpoint;
  $: thisSquare = gs.squares[x][y];

  function beginNominate() {
    gamestate.update((oldGs) => {
      return {
        currentlyNominatedSquare: [x, y],
        ...oldGs
      };
    });
  }
  
  function cancel() {
    gamestate.update((oldGs: MidgameViewpoint) => {
      delete oldGs.currentlyNominatedSquare;
      return oldGs
    });
  }

  function nominate() {
    lastAction.set({
      type: "nominate",
      square: [x, y],
      startingBid: bidAmount
    });
  }

  function bid() {
    lastAction.set({
      type: "bid",
      amount: bidAmount
    });
  }
</script>

<div class="outer">
  {#if thisSquare === Side.X}
    <X size={80} />
  {:else if thisSquare === Side.O}
    <O size={80} />
  {:else if gs.currentlyNominatedSquare && gs.currentlyNominatedSquare[0] === x && gs.currentlyNominatedSquare[1] === y}
    {#if gs.lastBid === undefined}
      <div>
        <p>Starting bid:</p>
        <div class="form-field">
          <input type="number"
              min={0}
              max={getPlayerByController(gs.players, gs.pov).money}
              bind:value={bidAmount}>
          <input type="submit"
              class="big-button"
              value="BID"
              on:submit={nominate}
              on:click={nominate}>
        </div>
        <div class="form-field">
          <input type="submit"
              class="big-button cancel"
              value="CANCEL"
              on:submit={cancel}
              on:click={cancel}>
        </div>
      </div>
    {:else}
      <div>
        <p>Bid:</p>
        <div class="form-field">
          <input type="number"
          min={gs.lastBid}
          max={getPlayerByController(gs.players, gs.pov).money}
          bind:value={bidAmount}>
          <input type="submit"
          class="big-button"
          value="BID"
          on:submit={bid}
          on:click={bid}>
        </div>
      </div>
    {/if}
  {:else if getPlayerByController(gs.players, gs.pov) && getPlayerByController(gs.players, gs.pov).side === gs.whoseTurnToNominate && gs.currentlyNominatedSquare === undefined}
    <button class="nominate"
        on:click={beginNominate}
        on:submit={beginNominate}>
      Nominate
    </button>
  {/if}
</div>

<style>
  .outer {
    height: 100%;
    width: 100%;
    justify-content: center;
    align-items: center;
    background-color: var(--bg-1);
  }

  .nominate {
    height: 70%;
    width: 70%;
    border-radius: 0.75rem;
    color: #668;
    background-color: #113;
    box-shadow: 0.5rem 0.5rem 1rem #113,
        0.5rem -0.5rem 1rem #113,
        -0.5rem -0.5rem 1rem #113,
        -0.5rem 0.5rem 1rem #113;
    border: 0.5rem solid transparent;
    opacity: 0;
    transition: opacity 0.2s ease-in-out;
  }

  .nominate:hover {
    opacity: 100%;
    transition: opacity 0.1s ease-in-out;
  }

  .cancel {
    margin-top: 0.5rem;
    flex: 1;
  }

  p {
    margin-top: 0;
    margin-bottom: 0.5rem;
  }

  input[type=number] {
    width: 2.5rem;
  }
</style>