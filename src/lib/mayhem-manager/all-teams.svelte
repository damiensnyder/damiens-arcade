<script lang="ts">
  import { lastAction } from "$lib/stores";
  import { ownTeamIndex, teams } from "$lib/mayhem-manager/stores";

  export let callback;  // changes which team we are viewing

  function replace(index: number): void {
    lastAction.set({
      type: "replace",
      team: index
    });
  }
</script>

<div>
  <h2>Teams</h2>
  {#each $teams as team, index}
    <div class="horiz">
      {team.name} ({team.controller}): ${team.money}
      {#if team.controller === "bot" && $ownTeamIndex === null}
        <button on:click={() => replace(index)} on:submit={() => replace(index)}>
          Replace
        </button>
      {/if}
      <button on:click={callback(index)} on:submit={callback(index)}>
        View
      </button>
    </div>
  {/each}
</div>