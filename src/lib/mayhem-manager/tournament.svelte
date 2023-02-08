<script lang="ts">
  import Bracket from "$lib/mayhem-manager/bracket.svelte";
  import { bracket, nextMatch, ownTeamIndex } from "$lib/mayhem-manager/stores";
  import PickFighters from "./pick-fighters.svelte";

  $: playingInNextGame = ($nextMatch.left.winner === $ownTeamIndex ||
       $nextMatch.right.winner === $ownTeamIndex) &&
      $nextMatch.winner === null;
</script>

{#if playingInNextGame}
  <PickFighters />
{/if}
<div class="column" style:flex=3>
  <h2 class="column-title">Bracket</h2>
  <div class="bracket">
    <Bracket {...$bracket} />
  </div>
</div>

<style>
  .bracket {
    overflow: scroll;
  }
</style>