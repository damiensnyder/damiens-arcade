<script lang="ts">
  import { lastAction } from "$lib/stores";
  import { teams } from "$lib/tourney/stores";

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
</script>

<div>
  <!-- really there should be a separate thing if you haven't joined or if it is the 1st season -->
  <h2>Re-sign and repair</h2>
</div>
<div>
  <h2>Players</h2>
  {#each $teams as team}
    <div>{team.name}: ${team.money} ({team.controller})</div>
  {/each}
  <div class="horiz">
    <button on:click={start} on:submit={start}>Join</button>
    <button on:click={leave} on:submit={leave}>Leave</button>
  </div>
</div>

<style>

</style>