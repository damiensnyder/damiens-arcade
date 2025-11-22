<script lang="ts">
  import { lastAction } from "$lib/stores";
  import { ownTeamIndex, history, teams } from "$lib/mayhem-manager/stores";
  import type { Team } from "$lib/mayhem-manager/types";

  export let callback;  // changes which team we are viewing

  function replace(index: number): void {
    lastAction.set({
      type: "replace",
      team: index
    });
  }

  function teamText(team: Team, index: number) {
    let text = team.name;
    if (index === $ownTeamIndex) {
      text += " (you)";
    } else if (team.controller === "bot") {
      text += " (bot)"
    }
    text += ": $" + team.money;
    const championships = $history.filter((b) => b.winner === team.name).length
    text += " • " + championships + " championship" + (championships === 1 ? "" : "s");
    return text;
  }
</script>

<div class="column">
  <h2 class="column-title">Teams</h2>
  {#each $teams as team, index}
    <div class="horiz text-and-buttons">
      {teamText(team, index)}
      <div class="right-align-outer">
        {#if team.controller === "bot" && $ownTeamIndex === null}
          <button class="right-align-inner"
              on:click={() => replace(index)} on:submit={() => replace(index)}>
            Replace
          </button>
        {/if}
        <button class="right-align-inner" on:click={callback(index)} on:submit={callback(index)}>
          View
        </button>
      </div>
    </div>
  {/each}
</div>