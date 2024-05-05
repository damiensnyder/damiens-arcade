<script lang="ts">
  import { host, lastAction, pov, roomName } from "$lib/stores";
  import { leagueExport, rawSettings } from "$lib/mayhem-manager/stores";
  import RoomSettingsEditor from "$lib/room-settings-editor.svelte";
  import type { MayhemManagerExport } from "./types";

  let firstUpdate = true;
  leagueExport.subscribe((newExport) => {
    if (firstUpdate) {
      firstUpdate = false;
    } else {
      downloadLeagueExport(newExport);
    }
  });

  function changeGameSettings() {
    lastAction.set({
      type: "changeGameSettings",
      settings: JSON.parse($rawSettings)
    });
  }

  function exportLeague() {
    lastAction.set({
      type: "export"
    });
  }

  function downloadLeagueExport(newExport: MayhemManagerExport) {
    const a = document.createElement('a');
    const blob = new Blob([JSON.stringify(newExport)]);
    const url = URL.createObjectURL(blob);
    a.setAttribute('href', url);
    a.setAttribute('download', `mayhem-manager-${$roomName}.json`);
    a.click();
  }
</script>

<RoomSettingsEditor />

<h3>Game Settings</h3>
<form>
  <label for="settings" style="margin-bottom: 0.3rem;">Settings:</label>
  <textarea disabled={$host !== $pov} name="settings" bind:value={$rawSettings}></textarea>
  {#if $host === $pov}
    <div class="horiz">
      <button on:submit|preventDefault={changeGameSettings} on:click|preventDefault={changeGameSettings}>update settings</button>
    </div>
  {/if}
  <button on:click={exportLeague} on:submit={exportLeague}>export league</button>
  {#if $host === $pov}
    <textarea name="league-import" bind:value={$rawSettings}></textarea>
    <div class="horiz">
      <button on:submit|preventDefault={exportLeague} on:click|preventDefault={exportLeague}>import league</button>
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