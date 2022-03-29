<script lang="ts">
  import { gamestate, lastAction } from "$lib/stores";
  import X from "$lib/auction-tic-tac-toe/x.svelte";
  import O from "$lib/auction-tic-tac-toe/o.svelte";
  import { Side, type Player } from "$lib/auction-tic-tac-toe/types";

  export let side: Side;

  let thisPlayer: Player = $gamestate.players.filter((player: Player) => {
    return player.side === side;
  })[0];
</script>

<div>
  {#if side === Side.X}
    <X size={120} />
  {:else}
    <O size={120} />
  {/if}
  <span>${thisPlayer.money}</span>
</div>
  
<style>
  span {
    font-size: 1.5rem;
    margin-top: 1rem;
  }
</style>