<script lang="ts">
  import { createForm } from "svelte-forms-lib";
  import { goto } from "$app/navigation";

  const { form, handleChange, handleSubmit } = createForm({
    initialValues: {
      roomName: "",
      isPrivate: true
    },
    onSubmit: async (values) => {
      const res = await fetch("/createRoom", {
        method: "POST",
        body: JSON.stringify(values),
      });
      if (res.ok) {
        const body: { roomCode: string } = await res.json();
        goto(`/game/${body.roomCode}`);
      }
    }
  });
</script>

<h2>Create Game</h2>

<form on:submit={handleSubmit}>
  <label>Room name:
    <input
      id="roomName"
      type="text"
      on:change={handleChange}
      bind:value={$form.roomName}>
  </label>
  <label>Private:
    <input
      id="isPrivate"
      type="checkbox"
      on:change={handleChange}
      bind:checked={$form.isPrivate}>
  </label>
  <button type="submit">Create</button>
</form>