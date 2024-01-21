<script lang="ts">
  import { host, lastAction, pov } from "$lib/stores";
  import { ownTeam, ownTeamIndex, teams } from "$lib/mayhem-manager/stores";
  import type { PreseasonTeam } from "$lib/mayhem-manager/types";
  import FighterInfo from "$lib/mayhem-manager/fighter-info.svelte";
  import EquipmentInfo from "$lib/mayhem-manager/equipment-info.svelte";

  $: needsResigning = $ownTeam !== null ? ($ownTeam as PreseasonTeam).needsResigning : [];
  $: needsRepair = $ownTeam !== null ? ($ownTeam as PreseasonTeam).needsRepair : [];

  let teamName = "";

  function start() {
    lastAction.set({
      type: "join",
      name: teamName
    });
  }

  function leave() {
    lastAction.set({
      type: "leave"
    });
  }

  function replace(team: number) {
    lastAction.set({
      type: "replace",
      team
    });
  }

  function remove(team: number) {
    lastAction.set({
      type: "remove",
      team
    });
  }

  function addBot() {
    lastAction.set({
      type: "addBot"
    });
  }

  function ready() {
    lastAction.set({
      type: "ready"
    });
  }
</script>

<div class="column" style:flex=5>
  {#if $ownTeamIndex !== null}
    <h2 class="column-title">Re-sign fighters</h2>
    <div>
      {#each needsResigning as fighter, index}
        <FighterInfo {fighter} {index} />
      {/each}
    </div>
    <h2>Repair equipment</h2>
    <div>
      {#each needsRepair as equipment, index}
        <EquipmentInfo {equipment} {index} />
      {/each}
    </div>
  {:else if $teams.length < 16}
    <div class="horiz">
      <form>
        <h2>Join the game</h2>
        <label>Team name
          <input type="text"
              bind:value={teamName}
              maxLength={20} />
        </label>
        <button on:click={start}
            on:submit={start}
            disabled={teamName.trim().length === 0 || $teams.some(t => t.name === teamName)}>
          Join
        </button>
      </form>
    </div>
  {/if}
</div>
<div class="players-list column" style:flex=4>
  <h2 class="column-title">Players</h2>
  {#each $teams as team, index}
    <div class="horiz text-and-buttons">
      <span class="team-name" style:color={index === $ownTeamIndex ? "var(--accent-4)" : "var(--text-1)"}>
        {team.name}: ${team.money} {team.controller === "bot" ? "(bot)" : ""}
      </span>
      <div class="right-align-outer">
        {#if team.controller === "bot"}
          {#if $ownTeamIndex === null}
            <button class="right-align-inner"
            on:click={() => replace(index)} on:submit={() => replace(index)}>Replace</button>
          {/if}
          {#if $host === $pov}
            <button class="right-align-inner"
            on:click={() => remove(index)} on:submit={() => remove(index)}>Remove</button>
          {/if}
        {:else if team.controller === $pov}
          <button class="right-align-inner"
          on:click={leave} on:submit={leave}>Leave</button>
        {/if}
      </div>
    </div>
  {/each}
  <div class="horiz controls">
    {#if $host === $pov && $teams.length < 16}
      <button class="right-align-inner"
          on:click={addBot} on:submit={addBot}>Add a bot</button>
    {/if}
    {#if $ownTeamIndex !== null}
      <button class="right-align-inner"
          on:click={ready} on:submit={ready}>Ready</button>
    {/if}
  </div>
</div>

<style>
  form {
    padding: 0.5rem;
    align-items: center;
  }

  label {
    margin-top: 1.25rem;
  }

  .players-list > .controls {
    align-self: center;
    margin-top: 1rem;
  }

  .team-name {
    flex-grow: 0
  }
</style>