<script lang="ts">
import { host, lastAction, pov } from "$lib/stores";
import { rawSettings } from "$lib/mayhem-manager/stores";

function changeGameSettings() {
  lastAction.set({
    type: "changeGameSettings",
    settings: JSON.parse($rawSettings)
  });
}

function start() {
  lastAction.set({
    type: "start"
  });
}
</script>

<h3>Game Settings</h3>
<form>
  <label for="settings" style="margin-bottom: 0.3rem;">Settings:</label>
  <textarea disabled={$host !== $pov} name="settings" bind:value={$rawSettings}></textarea>
  {#if $host === $pov}
    <div class="horiz">
      <button on:submit|preventDefault={changeGameSettings} on:click|preventDefault={changeGameSettings}>UPDATE SETTINGS</button>
      <button on:submit|preventDefault={start} on:click|preventDefault={start}>START</button>
    </div>
  {/if}
</form>

<style>
  .horiz {
    justify-content: space-between;
  }

  button {
    margin-top: 0.5rem;
  }
</style>