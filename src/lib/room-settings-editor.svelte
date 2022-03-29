<script lang="ts">
import GameTypeSwitcher from "$lib/game-type-switcher.svelte";
import { gamestate, lastAction } from "$lib/stores";

let roomName = $gamestate.roomName;
let isPublic = $gamestate.isPublic;

function changeRoomSettings() {
  lastAction.set({
    type: "changeRoomSettings",
    settings: {
      roomName: roomName,
      isPublic: isPublic
    }
  });
}
</script>

<h3>Room Settings</h3>
<form on:submit|preventDefault={changeRoomSettings}>
  <GameTypeSwitcher />
  <div class="form-field">
    <label for="roomName">Room name:</label>
    {#if $gamestate.host === $gamestate.pov}
      <input id="roomName" type="text" bind:value={roomName} />
    {:else}
      <input id="roomName" type="text" disabled value={$gamestate.roomName} />
    {/if}
  </div>
  <div class="form-field">
    <label for="public">List publicly:
      {#if $gamestate.host === $gamestate.pov}
        <input id="public" type="checkbox" bind:checked={isPublic} />
      {:else}
        <input id="public" type="checkbox" disabled checked={$gamestate.isPublic} />
      {/if}
    </label>
    {#if $gamestate.host === $gamestate.pov}
      <input type="submit" class="big-button" value="UPDATE SETTINGS" />
    {/if}
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
</style>