<script lang="ts">
  import "../styles/global.css";
  import "../styles/techno.css";
</script>

<svelte:head>
  <title>Damien's Arcade</title>
</svelte:head>

<h1>Damien's Arcade</h1>
<div class="game-links">
  <a href="/auction-tic-tac-toe">Auction Tic-Tac-Toe</a>
  <a href="/mayhem-manager">Mayhem Manager</a>
  <a href="/daily-qless">Daily Q-less</a>
</div>

<style>
  .game-links {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    align-items: center;
    margin-top: 2rem;
  }
  
  .game-links a {
    padding: 1rem 2rem;
    font-size: 1.2rem;
    text-decoration: none;
    border: 2px solid #ccc;
    border-radius: 8px;
    background: #f9f9f9;
    color: #333;
    transition: all 0.2s ease;
  }
  
  .game-links a:hover {
    background: #e9e9e9;
    border-color: #999;
  }
</style>