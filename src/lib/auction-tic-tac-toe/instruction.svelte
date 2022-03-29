<script lang="ts">
  import { gamestate } from "$lib/stores";
  import type { MidgameViewpoint, Player } from "$lib/auction-tic-tac-toe/types";

  $: gs = $gamestate as MidgameViewpoint;

  $: isOwnTurnToNominate = gs.players.every((player: Player) => {
    if (gs.whoseTurnToNominate === player.side) {
      return player.controller === gs.pov
    }
    return true;
  });
</script>

<p>
  {#if isOwnTurnToNominate}
    Click a square to put it up for auction.
  {:else}
    &nbsp;
  {/if}
</p>

<style>
  p {
    margin-top: 1.75rem;
  }
</style>