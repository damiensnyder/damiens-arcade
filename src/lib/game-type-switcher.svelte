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

<label>Game type:
  <select bind:value={gameType} on:change|preventDefault={changeGameType}>
    {#each Object.values(GameType) as gameTypeName}
      <option value={gameTypeName}>{gameTypeName}</option>
    {/each}
  </select>
</label>