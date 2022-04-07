<script lang="ts">
  import { players, turnPart, whoseTurnToNominate } from "$lib/auction-tic-tac-toe/stores";
  import { TurnPart } from "$lib/auction-tic-tac-toe/types";
  import { pov } from "$lib/stores";
</script>

<p>
  {#if $turnPart === TurnPart.Nominating && $players[$whoseTurnToNominate].controller === $pov}
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