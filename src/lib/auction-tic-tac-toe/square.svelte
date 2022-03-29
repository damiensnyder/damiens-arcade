<script lang="ts">
  import { gamestate, lastAction } from "$lib/stores";
  import { Side } from "$lib/auction-tic-tac-toe/types";
  import X from "$lib/auction-tic-tac-toe/x.svelte";
  import O from "$lib/auction-tic-tac-toe/o.svelte";

  export let x: number;
  export let y: number;

  $: thisSquare = $gamestate.squares[x][y];
</script>

<div class="outer">
  {#if thisSquare === Side.X}
    <X size={80} />
  {:else if thisSquare === Side.O}
    <O size={80} />
  {/if}
</div>

<style>
  .outer {
    height: 100%;
    width: 100%;
    justify-content: center;
    background-color: var(--bg-1);
  }
</style>