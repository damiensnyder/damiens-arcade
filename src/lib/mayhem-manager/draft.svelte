<script lang="ts">
  import { lastAction } from "$lib/stores";
  import { draftOrder, fighters, ownTeam, teams } from "$lib/mayhem-manager/stores";
  import FighterInfo from "./fighter-info.svelte";

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
      <FighterInfo {fighter} {index} />
    {/each}
  </div>
</div>
<div>
  <h2>Pick Order</h2>
  {#each $draftOrder as index, spotInOrder}
    <div class="horiz">
      <div class="team-name">{spotInOrder + 1}. {$teams[index].name}</div>
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
    align-self: stretch;
    justify-content: space-between;
    text-align: left;
  }

  button {
    margin-top: 0.25rem;
    margin-bottom: 0.25rem;
  }

  .team-name {
    margin-right: 1rem;
  }

  .fighters {
    flex: 1;
    align-items: stretch;
  }
</style>