<script lang="ts">
  import { createForm } from "svelte-forms-lib";
  import { goto } from "$app/navigation";
  import type { PublicRoomInfo } from "$lib/types";

  const { form, handleChange, handleSubmit } = createForm({
    initialValues: {
      roomCode: ""
    },
    onSubmit: async (values) => {
      goto(`/game/${values.roomCode}`);
    }
  });

  async function fetchGames(): Promise<PublicRoomInfo[]> {
    const res = await fetch("/active-rooms", {
      method: "GET",
    });
    return (await res.json()).rooms;
  }
</script>

<div class="top-level-menu">
  <h2>Join an existing game</h2>
  <div class="active-games">
    {#await fetchGames()}
      <p>Loading active games...</p>
    {:then rooms}
      {#each rooms as room}
        <p>
          <a href={`/game/${room.roomCode}`}>{room.roomName}</a> &middot;
          {room.gameType} &middot;
          {room.gameStage}
        </p>
      {/each}
      {#if rooms.length === 0}
        <p>No public games found.</p>
      {/if}
    {/await}
  </div>
  
  <form on:submit={handleSubmit}>
    <div class="form-field">
      <label for="roomCode">Room code:</label>
      <input
          id="roomCode"
          type="text"
          minlength="4"
          on:change={handleChange}
          bind:value={$form.roomCode}>
      <input type="submit" value="JOIN">
    </div>
  </form>
</div>

<style>
  p {
    flex: 1;
    margin: 0.5rem;
    text-align: left;
    white-space: nowrap;
    overflow: hidden;
  }

  .active-games {
    align-self: stretch;
    align-items: flex-start;
    flex: 1;
    margin: 1rem 0;
    max-height: 8rem;
    color: var(--text-4);
    background-color: var(--bg-1);
    border: 2px solid var(--text-4);
    border-radius: 0.4rem;
    font-size: 0.9rem;
    overflow-x: hidden;
    overflow-y: scroll;
  }

  input[type="submit"] {
    margin-top: 0;
  }

  .top-level-menu {
    width: 25%;
  }

  @media only screen and (max-width: 720px) {
    .top-level-menu {
      width: 40%;
    }
  }

  @media only screen and (min-width: 720px) and (max-width: 1200px) {
    .top-level-menu {
      width: 35%;
    }
  }
</style>