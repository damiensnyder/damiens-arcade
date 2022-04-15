<script lang="ts">
  import { nominating, players, turnPart, whoseTurnToBid, whoseTurnToNominate } from "$lib/auction-tic-tac-toe/stores";
  import { TurnPart } from "$lib/auction-tic-tac-toe/types";
  import { pov } from "$lib/stores";
</script>

<p>
  {#if $turnPart === TurnPart.Nominating && $players[$whoseTurnToNominate].controller === $pov}
    Click a square to put it up for auction.
  {:else if $turnPart === TurnPart.Nominating && $nominating !== null}
    Set your starting bid for this square.
  {:else if $turnPart === TurnPart.Nominating}
    Waiting for {$whoseTurnToNominate} to nominate a square.
  {:else if $turnPart === TurnPart.Bidding && $players[$whoseTurnToBid].controller === $pov}
    Decide how much you want to bid on the square, or if you want to pass.
  {:else if $turnPart === TurnPart.Bidding}
    Waiting for {$whoseTurnToBid} to bid.
  {:else}
    &nbsp;
  {/if}
</p>

<style>
  p {
    margin-top: 1.75rem;
  }
</style>