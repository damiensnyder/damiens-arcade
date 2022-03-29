<script lang="ts">
  import { gamestate } from "$lib/stores";
  import type { Player } from "$lib/auction-tic-tac-toe/types";

  $: isOwnTurnToNominate = $gamestate.players.every((player: Player) => {
    if ($gamestate.whoseTurnToNominate === player.side) {
      return player.controller === $gamestate.pov
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