<script lang="ts">
  import { lastAction } from "$lib/stores";
  import { draftOrder, fighters, ownTeam, ownTeamIndex, spotInDraftOrder, teams } from "$lib/mayhem-manager/stores";
  import FighterInfo from "$lib/mayhem-manager/fighter-info.svelte";

  function replace(team: number) {
    lastAction.set({
      type: "replace",
      team
    });
  }

  function pass() {
    lastAction.set({
      type: "pass"
    });
  }
</script>

<div>
  <h2>Fighters</h2>
  <div class="fighters">
    {#each $fighters as fighter, index}
      <FighterInfo {fighter} {index} />
    {/each}
  </div>
</div>
<div>
  <h2>Pick Order</h2>
  {#each $draftOrder as index, spotInOrder}
    <div class="horiz">
      {spotInOrder + 1}. {$teams[index].name}
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
  {#if $draftOrder[$spotInDraftOrder] === $ownTeamIndex}
    <button on:click={pass} on:submit={pass}>
      Pass
    </button>
  {/if}
</div>

<style>
  .horiz {
    align-self: stretch;
    justify-content: space-between;
    text-align: left;
  }

  .fighters {
    flex: 1;
    align-items: stretch;
  }
</style>