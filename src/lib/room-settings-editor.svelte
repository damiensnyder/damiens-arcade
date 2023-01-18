<script lang="ts">
import { host, isPublic, lastAction, pov, roomName } from "$lib/stores";

function changeRoomSettings() {
  lastAction.set({
    type: "changeRoomSettings",
    roomName: $roomName,
    isPublic: $isPublic
  });
}
</script>

<h3>Room Settings</h3>
<form on:submit|preventDefault={changeRoomSettings}>
  <div class="form-field">
    <label for="roomName">Room name:</label>
    <input id="roomName" type="text" disabled={$host !== $pov} bind:value={$roomName} />
  </div>
  <div class="form-field">
    <label for="public">List publicly:
      <input id="public" type="checkbox" disabled={$host !== $pov} bind:checked={$isPublic} />
    </label>
    {#if $host === $pov}
      <input type="submit" value="UPDATE SETTINGS" />
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

  input[type=text] {
    margin-right: 0;
  }

  input[type="submit"] {
    margin-top: 0;
  }
</style>