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

<h3>Room settings</h3>
<form on:submit|preventDefault={changeRoomSettings}>
  <GameTypeSwitcher gameType={gamestate.gameType} changeGameTypeCallback={changeRoomSettingsCallback} />
  <div class="form-field"><label for="roomName">Room name:</label> <input id="roomName" bind:value={roomName} /></div>
  <div class="form-field"><label for="public">List publicly:</label> <input id="public" type="checkbox" bind:checked={isPrivate} /></div>
  <input type="submit" class="big-button" value="Update settings" />
</form>