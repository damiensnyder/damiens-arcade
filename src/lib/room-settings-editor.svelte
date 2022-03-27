<script lang="ts">
import GameTypeSwitcher from "$lib/game-type-switcher.svelte";
import type { ActionCallback, Viewpoint } from "./types";

export let gamestate: Viewpoint;
export let changeRoomSettingsCallback: ActionCallback;

let roomName = gamestate.roomName;
let isPrivate = !gamestate.isPrivate;

function changeRoomSettings() {
  changeRoomSettingsCallback({
    type: "changeRoomSettings",
    settings: {
      roomName: roomName,
      isPrivate: !isPrivate
    }
  });
}
</script>

<h3>Room Settings</h3>
<form on:submit|preventDefault={changeRoomSettings}>
  <GameTypeSwitcher gameType={gamestate.gameType} changeGameTypeCallback={changeRoomSettingsCallback} isHost={gamestate.isHost} />
  <div class="form-field">
    <label for="roomName">Room name:</label>
    {#if gamestate.isHost}
      <input id="roomName" type="text" bind:value={roomName} />
    {:else}
      <input id="roomName" type="text" disabled value={gamestate.roomName} />
    {/if}
  </div>
  <div class="form-field">
    <label for="public">List publicly:
      {#if gamestate.isHost}
        <input id="public" type="checkbox" bind:checked={isPrivate} />
      {:else}
        <input id="public" type="checkbox" disabled checked={!gamestate.isPrivate} />
      {/if}
    </label>
    <input type="submit" class="big-button" disabled={!gamestate.isHost} value="UPDATE SETTINGS" />
  </div>
</form>

<style>
  h3 {
    margin-top: 0;
  }

  .form-field {
    margin: 0.25rem 0;
  }

  input[type=checkbox] {
    justify-self: flex-start;
  }

  input[type=text] {
    margin-right: 0;
  }
  
  .big-button {
    margin: 0;
  }
</style>