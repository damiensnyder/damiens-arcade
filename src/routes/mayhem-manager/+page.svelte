<script lang="ts">
  import { goto } from "$app/navigation";
  import "../../styles/global.css";
  import "../../styles/techno.css";

  async function createRoom() {
    const res = await fetch("/mayhem-manager/create-room", {
      method: "POST"
    });
    if (res.ok) {
      const body: { roomCode: string; } = await res.json();
      goto(`/mayhem-manager/${body.roomCode}`);
    }
  }
</script>

<svelte:head>
  <title>Mayhem Manager - Damien's Arcade</title>
</svelte:head>

<nav>
  <a href="/">← Back to Arcade</a>
</nav>

<h1>Mayhem Manager</h1>

<div class="game-lobby">
  <div class="lobby-section">
    <h2>Create a Game</h2>
    <button on:click={createRoom}>Create New Room</button>
  </div>

  <div class="lobby-section">
    <h2>Join a Game</h2>
    <form on:submit|preventDefault={(e) => {
      const formData = new FormData(e.target);
      const roomCode = formData.get('roomCode');
      if (roomCode) goto(`/mayhem-manager/${roomCode}`);
    }}>
      <input type="text" name="roomCode" placeholder="Enter room code" required>
      <button type="submit">Join Room</button>
    </form>
  </div>
</div>

<style>
  nav {
    margin-bottom: 1rem;
  }
  
  nav a {
    text-decoration: none;
    color: #666;
    font-size: 0.9rem;
  }
  
  nav a:hover {
    color: #333;
  }

  .game-lobby {
    display: flex;
    justify-content: center;
    gap: 3rem;
    margin-top: 2rem;
  }

  .lobby-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    padding: 2rem;
    border: 1px solid #ccc;
    border-radius: 8px;
    background: #f9f9f9;
  }

  .lobby-section h2 {
    margin: 0;
    font-size: 1.2rem;
  }

  button {
    padding: 0.8rem 1.5rem;
    font-size: 1rem;
    background: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.2s ease;
  }

  button:hover {
    background: #0056b3;
  }

  input[type="text"] {
    padding: 0.8rem;
    font-size: 1rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    width: 200px;
  }

  form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    align-items: center;
  }

  @media only screen and (max-width: 720px) {
    .game-lobby {
      flex-direction: column;
      gap: 1.5rem;
    }
  }
</style>