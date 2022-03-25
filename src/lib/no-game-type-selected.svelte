<script lang="ts">
import InviteLink from "./invite-link.svelte";
import { ActionCallback, GameType, Viewpoint } from "./types";

export let gamestate: Viewpoint;
export let socketCallback: ActionCallback;

let gameType = gamestate.settings.gameType;
let roomName = gamestate.roomName;
let isPrivate = gamestate.isPrivate;

function changeGameType() {
  socketCallback({
    type: "changeGameType",
    newGameType: gameType
  });
}

function changeRoomSettings() {
  socketCallback({
    type: "changeRoomSettings",
    settings: {
      roomName: roomName,
      isPrivate: isPrivate
    }
  });
}
</script>

{#if gamestate.isHost}
  <h3>Room settings</h3>
  <form>
    <select bind:value={gameType} on:change|preventDefault={changeGameType}>
      {#each Object.values(GameType) as gameTypeName}
        <option value={gameTypeName}>{gameTypeName}</option>
      {/each}
    </select>
    <label>Room name: <input bind:value={roomName} /></label>
    <label>Room is private: <input type="checkbox" bind:checked={isPrivate} /></label>
    <input type="submit" on:submit|preventDefault={changeRoomSettings} value="Update settings" />
  </form>
{/if}
<InviteLink />