<script lang="ts">
  import { host, lastAction, pov } from "$lib/stores";
  import { draftOrder, ownTeamIndex, teams } from "$lib/tourney/stores";

  function draft(fighter: number) {
    lastAction.set({
      type: "draft",
      fighter
    });
  }
</script>

<div>
  <h2>Fighters</h2>
</div>
<div>
  <h2>Draft Order</h2>
  {#each $draftOrder as index}
    {@const team = $teams[index]}
    <p>
      {index + 1}. {team.name}: ${team.money} ({team.controller})
    </p>
  {/each}
</div>

<style>
  p {
    text-align: left;
  }
</style>