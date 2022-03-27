<script lang="ts">
import type { AuctionTTTViewpoint } from "$lib/auction-tic-tac-toe/types";
import { Side } from "$lib/auction-tic-tac-toe/types";
import type { ActionCallback } from "$lib/types";

export let gamestate: AuctionTTTViewpoint;
export let changeGameSettingsCallback: ActionCallback;

let startingMoney = gamestate.settings.startingMoney;
let startingPlayer = gamestate.settings.startingPlayer;

function changeGameSettings() {
  changeGameSettingsCallback({
    type: "changeGameSettings",
    settings: {
      startingMoney: startingMoney,
      startingPlayer: startingPlayer
    }
  });
}
</script>

<h3>Game settings</h3>
<form on:submit|preventDefault={changeGameSettings}>
  <div class="form-field">
    <label for="startingMoney">Starting money:</label>
    {#if gamestate.isHost}
      <input type="number" min={0} bind:value={startingMoney} />
    {:else}
      <input type="number" disabled bind:value={gamestate.settings.startingMoney} />
    {/if}
  </div>
  <div class="form-field">
    <label for="startingPlayer">Starting player:</label>
    {#if gamestate.isHost}
      <select id="startingPlayer" bind:value={startingPlayer}>
        {#each Object.values(Side) as side}
          <option value={side}>{side === Side.None ? "Random" : side}</option>
        {/each}
      </select>
    {:else}
      <select id="startingPlayer" disabled bind:value={gamestate.settings.startingPlayer}>
        {#each Object.values(Side) as side}
          <option value={side}>{side === Side.None ? "Random" : side}</option>
        {/each}
      </select>
    {/if}
    <input type="submit"
        class="big-button"
        value="UPDATE SETTINGS"
        disabled={!gamestate.isHost} />
  </div>
</form>

<style>
  .form-field {
    margin: 0.25rem 0;
  }

  input[type=number] {
    margin-right: 0;
  }
  
  .big-button {
    margin: 0;
  }
</style>