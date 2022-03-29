<script lang="ts">
  import { gamestate, lastAction } from "$lib/stores";
  import { Side } from "$lib/auction-tic-tac-toe/types";
  import type { MidgameViewpoint } from "$lib/auction-tic-tac-toe/types";
  import X from "$lib/auction-tic-tac-toe/x.svelte";
  import O from "$lib/auction-tic-tac-toe/o.svelte";
import { getPlayerByController } from "./utils";

  export let x: number;
  export let y: number;

  $: gs = $gamestate as MidgameViewpoint;
  $: thisSquare = gs.squares[x][y];
</script>

<div class="outer">
  {#if thisSquare === Side.X}
    <X size={80} />
  {:else if thisSquare === Side.O}
    <O size={80} />
  {:else if getPlayerByController(gs.players, gs.pov).side === gs.whoseTurnToNominate}
    <button>Nominate me.</button>
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