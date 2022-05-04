<script lang="ts">
  import { gameStage, ownTeam } from "$lib/tourney/stores";
  import Preseason from "$lib/tourney/preseason.svelte";
  import Draft from "$lib/tourney/draft.svelte";
</script>

<div class="fun">
  <div class="top-icons horiz">
    <h2>{$gameStage}</h2>
    {#if ownTeam !== null}
      <button>My Team</button>
    {/if}
    <button>All teams</button>
  </div>
  
  <div class="container horiz">
    {#if $gameStage === "preseason"}
      <Preseason />
    {:else if $gameStage === "draft"}
      <Draft />
    {/if}
  </div>
</div>
  
<style>
  .top-icons {
    justify-content: stretch;
    margin: 0 1.5rem;
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

  h2 {
    margin: 0 0.5rem;
    flex: 1;
  }

  button {
    margin: 0 0.5rem;
  }
</style>