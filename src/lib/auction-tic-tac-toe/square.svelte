<script lang="ts">
  import { lastAction, pov } from "$lib/stores";
  import { Side, TurnPart } from "$lib/auction-tic-tac-toe/types";
  import X from "$lib/auction-tic-tac-toe/x.svelte";
  import O from "$lib/auction-tic-tac-toe/o.svelte";
  import { currentBid, currentlyNominatedSquare, lastBid, nominating, players, squares, turnPart, whoseTurnToBid, whoseTurnToNominate } from "$lib/auction-tic-tac-toe/stores";

  export let x: number;
  export let y: number;
  
  $: thisSquare = $squares[x][y];
  $: isCurrentlyNominated = $currentlyNominatedSquare !== null &&
      x === $currentlyNominatedSquare[0] &&
      y === $currentlyNominatedSquare[1];
  $: isNominating = $nominating !== null &&
      x === $nominating[0] &&
      y === $nominating[1];

  function beginNominate() {
    $nominating = [x, y];
    $currentBid = 0;
  }
  
  function cancel() {
    $nominating = null;
  }

  function nominate() {
    lastAction.set({
      type: "nominate",
      square: [x, y],
      startingBid: $currentBid
    });
  }

  function bid() {
    lastAction.set({
      type: "bid",
      amount: $currentBid
    });
  }

  function pass() {
    lastAction.set({
      type: "pass"
    });
  }
</script>

<div class="outer">
  {#if thisSquare === Side.X}
    <X size={100} />
  {:else if thisSquare === Side.O}
    <O size={100} />
  {:else if $turnPart === TurnPart.Bidding && $players[$whoseTurnToBid].controller === $pov && isCurrentlyNominated}
    <div>
      <p>Bid:</p>
      <div class="form-field">
        <input type="number"
            min={$lastBid + 1}
            max={$players[$whoseTurnToBid].money}
            bind:value={$currentBid}>
        <input type="submit"
            class="big-button"
            value="BID"
            on:submit={bid}
            on:click={bid}>
      </div>
      <div class="form-field">
        <input type="submit"
            class="big-button cancel"
            value="PASS"
            on:submit={pass}
            on:click={pass}>
      </div>
    </div>
  {:else if isNominating}
    <div>
      <p>Starting bid:</p>
      <div class="form-field">
        <input type="number"
            min={0}
            max={$players[$whoseTurnToNominate].money}
            bind:value={$currentBid}>
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
  {:else if $players[$whoseTurnToNominate].controller === $pov && $turnPart === TurnPart.Nominating}
    <button class="nominate"
        on:click={beginNominate}
        on:submit={beginNominate}>
      Nominate
    </button>
  {:else if isCurrentlyNominated}
    <span class="last-bid">${$lastBid}</span>
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

  .last-bid {
    font-size: 2.5rem;
    font-weight: 200;
  }

  p {
    margin-top: 0;
    margin-bottom: 0.5rem;
  }

  input[type=number] {
    width: 2.5rem;
  }
</style>