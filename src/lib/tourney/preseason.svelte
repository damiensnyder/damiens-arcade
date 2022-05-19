<script lang="ts">
  import { host, lastAction, pov } from "$lib/stores";
  import { ownTeamIndex, teams } from "$lib/tourney/stores";

  function start() {
    lastAction.set({
      type: "join"
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

  function advance() {
    lastAction.set({
      type: "advance"
    });
  }
</script>

<div>
  {#if $ownTeamIndex !== null && $teams.length < 16}
    <h2>Re-sign and repair</h2>
  {:else}
    <div class="horiz">
      <button on:click={start} on:submit={start}>Join</button>
    </div>
  {/if}
</div>
<div class="players-list">
  <h2>Players</h2>
  {#each $teams as team, index}
    <div class="horiz">
      <span class="team-info">{team.name}: ${team.money} ({team.controller})</span>
      {#if team.controller === "bot"}
        {#if $ownTeamIndex === null}
          <button on:click={() => replace(index)} on:submit={() => replace(index)}>Replace</button>
        {/if}
        {#if $host === $pov}
          <button on:click={() => remove(index)} on:submit={() => remove(index)}>Remove</button>
        {/if}
      {:else if team.controller === $pov}
        <button on:click={leave} on:submit={leave}>Leave</button>
      {/if}
    </div>
  {/each}
  {#if $host === $pov}
    <div class="horiz host-controls">
      {#if $teams.length < 16}
        <button on:click={addBot} on:submit={addBot}>Add Bot</button>
      {/if}
      <button on:click={advance} on:submit={advance}>Go to draft</button>
    </div>
  {/if}
</div>

<style>
  h2 {
    padding-bottom: 1rem;
  }

  .players-list > .horiz {
    align-self: flex-start;
    align-items: center;
  }

  .players-list > .host-controls {
    align-self: center;
    margin-top: 1rem;
  }

  button {
    margin: 0 0.25rem;
  }
  
  button:last-child {
    margin-right: 0;
  }

  .team-info {
    padding: 0.3rem;
  }
</style>