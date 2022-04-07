<script lang="ts">
import { Side } from "$lib/auction-tic-tac-toe/types";
import { host, lastAction, pov } from "$lib/stores";
import { settings } from "$lib/auction-tic-tac-toe/stores";

let startingMoney = $settings.startingMoney;
let startingPlayer = $settings.startingPlayer;

function changeGameSettings() {
  lastAction.set({
    type: "changeGameSettings",
    settings: {
      startingMoney: startingMoney,
      startingPlayer: startingPlayer
    }
  });
}
</script>

<h3>Game Settings</h3>
<form on:submit|preventDefault={changeGameSettings}>
  <div class="form-field">
    <label for="startingMoney">Starting money:</label>
    {#if $host === $pov}
      <input type="number" min={0} bind:value={startingMoney} />
    {:else}
      <input type="number" disabled bind:value={$settings.startingMoney} />
    {/if}
  </div>
  <div class="form-field">
    <label for="startingPlayer">Starting player:</label>
    {#if $host === $pov}
      <select id="startingPlayer" bind:value={startingPlayer}>
        {#each Object.values(Side) as side}
          <option value={side}>{side === Side.None ? "Random" : side}</option>
        {/each}
      </select>
    {:else}
      <select id="startingPlayer" disabled bind:value={$settings.startingPlayer}>
        {#each Object.values(Side) as side}
          <option value={side}>{side === Side.None ? "Random" : side}</option>
        {/each}
      </select>
    {/if}
    {#if $host === $pov}
      <input type="submit"
          class="big-button"
          value="UPDATE SETTINGS" />
    {/if}
  </div>
</form>

<style>
  .form-field {
    margin: 0.25rem 0;
  }

  input[type=number] {
    margin-right: 0;
  }
</style>