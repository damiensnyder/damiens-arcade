<script lang="ts">
  import { host, lastAction, pov, roomName } from "$lib/stores";
  import { leagueExport, rawSettings } from "$lib/mayhem-manager/stores";
  import RoomSettingsEditor from "$lib/room-settings-editor.svelte";
  import type { MayhemManagerExport } from "./types";

  let leagueImportRaw = "";
  let firstUpdate = true;

  leagueExport.subscribe((newExport) => {
    if (firstUpdate) {
      firstUpdate = false;
    } else {
      downloadLeagueExport(newExport);
    }
  });

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

  function importLeague() {
    lastAction.set({
      type: "import",
      ...JSON.parse(leagueImportRaw)
    });
  }
</script>

<div>
  <RoomSettingsEditor />
</div>

<div>
  <h3>Export league to file:</h3>
  <button on:click={exportLeague} on:submit={exportLeague}>export</button>
  <h3>Import league:</h3>
  {#if $host === $pov}
    <textarea name="league-import" bind:value={leagueImportRaw} placeholder={"(paste league file here)"}></textarea>
    <div class="horiz">
      <button on:submit|preventDefault={importLeague}
          on:click|preventDefault={importLeague}
          disabled={leagueImportRaw.length === 0}>
        import
      </button>
    </div>
  {/if}
</div>

<style>
  .horiz {
    justify-content: space-between;
  }

  button {
    margin-top: 0.5rem;
  }

  input[type=submit] {
    text-transform: lowercase;
  }
</style>