<script lang="ts">
  import { createForm } from "svelte-forms-lib";
  import { goto } from "$app/navigation";
  import type { PublicRoomInfo } from "./types";

  const { form, handleChange, handleSubmit } = createForm({
    initialValues: {
      roomCode: ""
    },
    onSubmit: async (values) => {
      goto(`/game/${values.roomCode}`);
    }
  });

  async function fetchGames(): Promise<PublicRoomInfo[]> {
    const res = await fetch("/activeRooms", {
      method: "GET",
    });
    return (await res.json()).rooms;
  }
</script>

<h2>Join Game</h2>

<div>
  {#await fetchGames()}
    Loading active games...
  {:then rooms}
    {#each rooms as room}
      <div>
        <p><a href={`/game/${room.roomCode}`}>{room.roomName}</a></p>
      </div>
    {/each}
  {/await}
</div>

<form on:submit={handleSubmit}>
  <label>Join room from code:
    <input
      id="roomCode"
      type="text"
      on:change={handleChange}
      bind:value={$form.roomCode}>
  </label>
  <button type="submit">Join</button>
</form>