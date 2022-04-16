<script lang="ts">
import { Side } from "$lib/auction-tic-tac-toe/types";
import { host, lastAction, pov } from "$lib/stores";
import { settings } from "$lib/auction-tic-tac-toe/stores";

function changeGameSettings() {
  lastAction.set({
    type: "changeGameSettings",
    settings: $settings
  });
}
</script>

<h3>Game Settings</h3>
<form on:submit|preventDefault={changeGameSettings}>
  <div class="form-field">
    <label for="startingMoney">Starting money:</label>
    <input type="number" min={0} disabled={$host !== $pov} bind:value={$settings.startingMoney} />
  </div>
  <div class="form-field">
    <label for="startingPlayer">Starting player:</label>
    <select id="startingPlayer" disabled={$host !== $pov} bind:value={$settings.startingPlayer}>
      {#each Object.values(Side) as side}
        <option value={side}>{side === Side.None ? "Random" : side}</option>
      {/each}
    </select>
  </div>
  <div class="form-field">
    <label for="useTiebreaker">Use time as tiebreaker:
      <input id="useTiebreaker" type="checkbox" disabled={$host !== $pov} bind:checked={$settings.useTiebreaker} />
    </label>
  {#if $host === $pov}
    <input type="submit"
        class="big-button"
        value="UPDATE SETTINGS" />
  {/if}
</form>

<style>
  .form-field {
    margin: 0.25rem 0;
  }

  input[type=number] {
    margin-right: 0;
  }
</style>