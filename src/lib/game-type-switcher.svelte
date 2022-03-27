<script lang="ts">
import { GameType } from "./types";
import type { ActionCallback } from "./types";

export let gameType: GameType;
export let changeGameTypeCallback: ActionCallback;

function changeGameType() {
  changeGameTypeCallback({
    type: "changeGameType",
    newGameType: gameType
  });
}
</script>

<div class="form-field">
  <label for="gameType">Game type:</label>
  <select id="gameType" bind:value={gameType} on:change|preventDefault={changeGameType}>
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