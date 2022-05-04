<script lang="ts">
  import { gameStage } from "$lib/tourney/stores";
  import Preseason from "$lib/tourney/preseason.svelte";
</script>

<div class="whole-game-container">
  <div class="top-icons horiz">
    <button>Preseason</button>
    <button>Draft</button>
    <button>Free agency</button>
    <button>Equipment</button>
    <button>Practice</button>
    <button>Battle royale</button>
    <button>Tourney time!</button>
  </div>
  
  <div class="container horiz">
    {#if $gameStage === "preseason"}
    <Preseason />
    {/if}
  </div>
</div>
  
<style>
  .top-icons {
    justify-content: center;
  }

  .container {
    flex: 1;
    margin: 1rem 2rem 2rem 2rem;
    justify-content: space-evenly;
    align-items: stretch;
    background-color: var(--bg-fun-3);
    border-radius: 1.5rem;
    border: 3px solid var(--bg-fun-2);
  }

  button {
    width: 5rem;
    height: 5rem;
    margin: 1rem;
    font-size: 0.8rem;
    border-radius: 50%;
  }
</style>