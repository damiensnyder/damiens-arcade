<script lang="ts">
  export let gamestate;
  export let socketCallback;

  let roomName = gamestate.roomName;
  let isPrivate = gamestate.isPrivate;

  function isPrivateChange(newIsPrivate: boolean) {
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