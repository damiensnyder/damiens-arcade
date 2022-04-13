<script lang="ts">
  import { GameType } from "$lib/types";
  import { gameType, host, lastAction, pov } from "$lib/stores";

  function changeGameType() {
    lastAction.set({
      type: "changeGameType",
      newGameType: $gameType
    });
  }
</script>

<div class="form-field">
  <label for="gameType">Game type:</label>
  <select id="gameType"
      disabled={$host !== $pov}
      bind:value={$gameType}
      on:change|preventDefault={changeGameType}>
    {#each Object.values(GameType) as gameTypeName}
      <option value={gameTypeName}>{gameTypeName}</option>
    {/each}
  </select>
</div>

<style>
  select {
    margin-right: 0;
  }

  .form-field {
    margin: 0.25rem 0;
  }
</style>