<script lang="ts">
import { host, lastAction, pov } from "$lib/stores";
import { rawSettings } from "$lib/tourney/stores";

function changeGameSettings() {
  lastAction.set({
    type: "changeGameSettings",
    settings: JSON.parse($rawSettings)
  });
}
</script>

<h3>Game Settings</h3>
<form on:submit|preventDefault={changeGameSettings}>
  <label for="settings" style="margin-bottom: 0.3rem;">Settings:</label>
  <textarea disabled={$host !== $pov} name="settings" bind:value={$rawSettings}></textarea>
  {#if $host === $pov}
    <div class="horiz">
      <input type="submit" value="UPDATE SETTINGS" />
      <button>START</button>
    </div>
  {/if}
</form>

<style>
  .horiz {
    justify-content: space-between;
  }

  button,
  input[type="submit"] {
    margin-top: 0.5rem;
  }
</style>