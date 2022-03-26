<script lang="ts">
import GameTypeSwitcher from "$lib/game-type-switcher.svelte";
import type { ActionCallback, Viewpoint } from "./types";

export let gamestate: Viewpoint;
export let changeRoomSettingsCallback: ActionCallback;

let roomName = gamestate.roomName;
let isPrivate = gamestate.isPrivate;

function changeRoomSettings() {
  changeRoomSettingsCallback({
    type: "changeRoomSettings",
    settings: {
      roomName: roomName,
      isPrivate: isPrivate
    }
  });
}
</script>

<h3>Room settings</h3>
<form on:submit|preventDefault={changeRoomSettings}>
  <GameTypeSwitcher gameType={this.gamestate.gameType} changeGameTypeCallback={changeRoomSettingsCallback} />
  <label>Room name: <input bind:value={roomName} /></label>
  <label>Room is private: <input type="checkbox" bind:checked={isPrivate} /></label>
  <input type="submit" value="Update settings" />
</form>