<script lang="ts">
  import { host, lastAction, pov } from "$lib/stores";
  import { draftOrder, fighters, ownTeam, ownTeamIndex, teams } from "$lib/tourney/stores";

  function draft(fighter: number) {
    lastAction.set({
      type: "draft",
      fighter
    });
  }

  function replace(team: number) {
    lastAction.set({
      type: "replace",
      team
    });
  }
</script>

<div>
  <h2>Fighters</h2>
  {#each $fighters as fighter}
    <div class="horiz">
      <h3>{fighter.name}</h3>
      <div>
        Strength: {fighter.stats.strength}
        Accuracy: {fighter.stats.accuracy}
        Reflexes: {fighter.stats.reflexes}
        Energy: {fighter.stats.energy}
        Toughness: {fighter.stats.toughness}
        Speed: {fighter.stats.speed}
      </div>
    </div>
  {/each}
</div>
<div>
  <h2>Draft Order</h2>
  {#each $draftOrder as index}
    {@const team = $teams[index]}
    <div class="horiz">
      {index + 1}. {team.name}: ${team.money} ({team.controller})
      {#if $ownTeam === null && team.controller === "bot"}
        <button on:click={() => replace(0)} on:submit={() => replace(0)}>Replace</button>
      {/if}
    </div>
  {/each}
</div>

<style>
  p {
    text-align: left;
  }
</style>