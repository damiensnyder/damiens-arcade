<script lang="ts">
  import { host, lastAction, pov } from "$lib/stores";
  import { draftOrder, fighters, ownTeam, ownTeamIndex, teams } from "$lib/tourney/stores";
import FighterInfo from "./fighter-info.svelte";

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
  <div class="fighters">
    {#each $fighters as fighter, index}
      <FighterInfo {...fighter} {index} />
    {/each}
  </div>
</div>
<div>
  <h2>Draft Order</h2>
  {#each $draftOrder as index}
    <div class="horiz">
      {index + 1}. {$teams[index].name}
      {#if $ownTeam === null && $teams[index].controller === "bot"}
        <button on:click={() => replace(index)} on:submit={() => replace(index)}>
          Replace
        </button>
      {/if}
    </div>
  {/each}
</div>

<style>
  .horiz {
    text-align: left;
  }

  .fighters {
    flex: 1;
    align-items: stretch;
  }
</style>