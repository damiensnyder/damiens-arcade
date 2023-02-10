<script lang="ts">
  import { goto } from "$app/navigation";
  import { GameType } from "$lib/types";

  async function createRoom(gameType: string) {
    const res = await fetch("/create-room/" + gameType, {
      method: "POST"
    });
    if (res.ok) {
      const body: { roomCode: string; } = await res.json();
      // goto(`/${gameType}/${body.roomCode}`);  keeps styles, which we don't want
      window.location.href = window.location.href +
          `${window.location.href.endsWith("/") ? "" : "/"}${gameType}/${body.roomCode}`;
    }
  }
</script>

<div class="top-level-menu">
  <h2>Create a game</h2>

  <form on:submit|preventDefault={() => createRoom(GameType.AuctionTTT)}>
    <input type="submit" value="Auction Tic-Tac-Toe">
  </form>

  <form on:submit|preventDefault={() => createRoom(GameType.MayhemManager)}>
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

  @media only screen and (max-width: 720px) {
    .top-level-menu {
      width: 40%;
    }
  }
</style>