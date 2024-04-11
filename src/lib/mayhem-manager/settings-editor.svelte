<script lang="ts">
  import { host, lastAction, pov } from "$lib/stores";
  import { rawSettings } from "$lib/mayhem-manager/stores";
  import RoomSettingsEditor from "$lib/room-settings-editor.svelte";
    import type { MayhemManagerExport, PreseasonTeam } from "./types";

  function changeGameSettings() {
    lastAction.set({
      type: "changeGameSettings",
      settings: JSON.parse($rawSettings)
    });
  }

  function exportLeague() {
    let exportBase: MayhemManagerExport = {
      gameStage: this.gameStage,
      teams: this.teams,
      history: this.history,
      settings: this.settings
    }
    if (this.gameStage === "preseason") {
      exportBase = {
        ...exportBase,
        gameStage: "preseason",
        teams: this.teams as PreseasonTeam[]
      }
    } else if (this.gameStage === "draft") {
      exportBase = {
        ...exportBase,
        gameStage: "draft",
        draftOrder: this.draftOrder,
        spotInDraftOrder: this.spotInDraftOrder,
        fighters: this.fighters,
        unsignedVeterans: this.unsignedVeterans,
      }
    } else if (this.gameStage === "free agency") {
      exportBase = {
        ...exportBase,
        gameStage: "free agency",
        draftOrder: this.draftOrder,
        spotInDraftOrder: this.spotInDraftOrder,
        fighters: this.fighters
      }
    } else if (this.gameStage === "training") {
      exportBase = {
        ...exportBase,
        gameStage: "training",
        equipmentAvailable: this.equipmentAvailable
      }
    } else if (this.gameStage === "battle royale") {
      exportBase = {
        ...exportBase,
        gameStage: "battle royale"
      }
    } else if (this.gameStage === "tournament") {
      exportBase = {
        ...exportBase,
        gameStage: "tournament",
        bracket: this.bracket,
        nextMatch: this.nextMatch
      }
    }
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