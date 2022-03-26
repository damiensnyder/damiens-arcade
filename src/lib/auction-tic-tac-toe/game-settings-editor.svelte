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
  <label>Starting money: <input type="number" bind:value={startingMoney} /></label>
  <label>Starting player:
    <select bind:value={startingPlayer}>
      {#each Object.values(Side) as side}
        <option value={side}>{side}</option>
      {/each}
    </select>
  </label>
  <input type="submit" value="Update settings" />
</form>