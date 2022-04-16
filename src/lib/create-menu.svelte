<script lang="ts">
  import { createForm } from "svelte-forms-lib";
  import { goto } from "$app/navigation";

  const { handleSubmit } = createForm({
    onSubmit: async (_values) => {
      const res = await fetch("/createRoom", {
        method: "POST"
      });
      if (res.ok) {
        const body: { roomCode: string; } = await res.json();
        goto(`/game/${body.roomCode}`);
      }
    },
    initialValues: undefined
  });
</script>

<div class="top-level-menu">
  <h2>Create a game</h2>

  <form on:submit={handleSubmit}>
    <input class="big-button" type="submit" value="CREATE">
  </form>
</div>

<style>
  .big-button {
    width: min-content;
    align-self: center;
  }

  .top-level-menu {
    width: 25%;
  }
</style>