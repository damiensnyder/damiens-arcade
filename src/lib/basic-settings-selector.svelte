<script lang="ts">
import InviteLink from "./invite-link.svelte";

  export let gamestate;
  export let socketCallback;

  let roomName = gamestate.roomName;
  let isPrivate = gamestate.isPrivate;

  function isPrivateChange (newIsPrivate) {
    socketCallback({
      type: "changeSettings",
      settings: {
        roomName: roomName,
        isPrivate: newIsPrivate
      }
    });
  }
</script>

{#if gamestate.isHost}
  <form>
    <input bind:value={roomName} />
    <input type="checkbox" bind:checked={isPrivate} on:change={isPrivateChange} />
  </form>
{/if}
<InviteLink />