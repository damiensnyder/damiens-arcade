<script lang="ts">
  import { lastAction } from "$lib/stores";
  import { draftOrder, fighters, ownTeam, ownTeamIndex, spotInDraftOrder, teams } from "$lib/mayhem-manager/stores";
  import FighterInfo from "./fighter-info.svelte";

  function replace(team: number) {
    lastAction.set({
      type: "replace",
      team
    });
  }
</script>

<div class="column" style:flex=2>
  <h2 class="column-title">Fighters</h2>
  <div class="fighters">
    {#each $fighters as fighter, index}
      <FighterInfo {fighter} {index} />
    {/each}
  </div>
</div>
<div class="column" style:flex=1>
  <h2 class="column-title">Pick Order</h2>
  {#each $draftOrder as index, spotInOrder}
    <div class="horiz text-and-buttons">
      <span class="team-name" style:color={index === $ownTeamIndex ?
                                           "var(--accent-4)" :
                                           (spotInOrder === $spotInDraftOrder ?
                                            "var(--accent-5)" :
                                            "var(--text-1)")}>
        {spotInOrder + 1}. {$teams[index].name}
        {#if spotInOrder === $spotInDraftOrder}
          are on the clock...
        {/if}
      </span>
      {#if $ownTeam === null && $teams[index].controller === "bot"}
        <div class="right-align-outer">
          <button class="right-align-inner"
              on:click={() => replace(index)} on:submit={() => replace(index)}>
            Replace
          </button>
        </div>
      {/if}
    </div>
  {/each}
</div>

<style>
  .fighters {
    flex: 1;
    align-items: stretch;
  }
</style>