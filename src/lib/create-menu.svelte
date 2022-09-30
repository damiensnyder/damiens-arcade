<script lang="ts">
  import { goto } from "$app/navigation";
  import { GameType } from "$lib/types";

  async function createRoom(gameType: string) {
    const res = await fetch("/create-room/", {
      method: "POST"
    });
    if (res.ok) {
      const body: { roomCode: string; } = await res.json();
      goto(`/${gameType}/${body.roomCode}`);
    }
  }
</script>

<div class="top-level-menu">
  <h2>Create a game</h2>

  <form on:submit={() => createRoom(GameType.AuctionTTT)}>
    <input type="submit" value="Auction Tic-Tac-Toe">
  </form>

  <form on:submit={() => createRoom(GameType.MayhemManager)}>
    <input type="submit" value="Mayhem Manager">
  </form>
</div>

<style>
  input[type="submit"] {
    width: min-content;
    align-self: center;
  }

  .top-level-menu {
    width: 25%;
  }
</style>