<script lang="ts">
  import { goto } from "$app/navigation";

  import "../../styles/global.css";
  import "../../styles/techno.css";

  async function createRoom() {
    const res = await fetch("/auction-tic-tac-toe/create-room", {
      method: "POST"
    });
    if (res.ok) {
      const body: { roomCode: string; } = await res.json();
      goto(`/auction-tic-tac-toe/${body.roomCode}`);  // keeps styles which is ok for ATTT
    } else {
      console.error("Error " + res.status.toString() + ": " + res.statusText);
    }
  }
</script>

<button on:click={createRoom} on:submit={createRoom}>
  Create Game
</button>