<script lang="ts">
  import Bracket from "$lib/mayhem-manager/bracket.svelte";
  import { bracket, nextMatch, ownTeamIndex, teams } from "$lib/mayhem-manager/stores";
    import { host, lastAction, pov } from "$lib/stores";
  import PickFighters from "./pick-fighters.svelte";

  $: playingInNextGame = ($nextMatch.left.winner === $ownTeamIndex ||
       $nextMatch.right.winner === $ownTeamIndex) &&
      $nextMatch.winner === null;

  // if in next fight or if last fight was championship, just stop watching. else advance
  function advance(): void {
    lastAction.set({ type: "advance" });
  }
</script>

{#if playingInNextGame}
  <PickFighters />
{/if}
<div class="column" style:flex=3>
  <h2 class="column-title">Bracket</h2>
  <div class="bracket">
    <Bracket {...$bracket} />
  </div>

  {#if $host === $pov &&
      $teams[$nextMatch.left?.winner ?? -1]?.controller === "bot" &&
      $teams[$nextMatch.right?.winner ?? -1]?.controller === "bot"}
    <div class="horiz"><button on:click={advance} on:submit={advance}>start fight</button> <div class="bot-vs-bot">(match is bot vs bot)</div></div>
  {/if}
</div>

<style>
  .bracket {
    overflow: scroll;
  }

  .bot-vs-bot {
    margin: 1rem 1rem 0;
  }
</style>