<script lang="ts">
  import "../../styles/global.css";
  import "../../styles/techno.css";

  let grid: string[][] = Array(13).map(_ => Array(12).map(_ => ""));
  grid[5][4] = "a"
</script>
  
<svelte:head>
  <title>Damien's Arcade | Daily Q-less</title>
</svelte:head>

<h1>Daily Q-less</h1>

<div class="grid-outer">
  <div class="grid-inner">
    {#each grid as row}
      {#each row as cell}
        <div class="cell">
          {cell}
        </div>
      {/each}
    {/each}
  </div>
</div>

<style>
  .grid-outer {
    margin: 2rem 0 2rem 2rem;
    width: 70%;
    height: 60vh;
    background-color: var(--bg-3);
    overflow-x: scroll;
    overflow-y: scroll;
  }

  .grid-inner {
    text-transform: capitalize;
    /* display: grid;
    padding: 1rem;
    gap: 1rem;
    grid-template-rows: repeat(12, 5rem);
    grid-template-columns: 12; */
  }

  .cell {
    width: 5rem;
    height: 5rem;
    margin: 1rem;
    background-color: var(--bg-2);
  }
</style>