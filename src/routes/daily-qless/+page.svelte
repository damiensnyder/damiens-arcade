<script lang="ts">
  import "../../styles/global.css";
  import "../../styles/techno.css";

  let grid: string[][] = [...Array(13)].map((_, i) => Array(12).fill(""));
  grid[5].splice(4, 4, "a", "b", "b", "c");
  grid[6].splice(4, 4, "d", "f", "h", "n");
  grid[7].splice(4, 4, "o", "o", "p", "w");
</script>
  
<svelte:head>
  <title>Damien's Arcade | Daily Q-less</title>
</svelte:head>

<h1>Daily Q-less</h1>

<div class="grid-outer">
  <div class="grid-inner">
    {#each grid as row, x}
      {#each row as cell, y}
        <div class={grid[x][y] === "" ? "cell" : "cell filled"} style:grid-area={`${x + 1} / ${y + 1}`}>
          {cell}
        </div>
      {/each}
    {/each}
  </div>
</div>

<style>
  .grid-outer {
    max-width: 70%;
    max-height: 60vh;
    margin: 2rem;
    display: flex;
    justify-content: safe center;
    align-items: safe center;
    overflow-x: scroll;
    overflow-y: scroll;
    border-radius: 0.75rem;
    background-color: var(--bg-3);
  }

  .grid-inner {
    display: grid;
    gap: 15px;
    grid-template-rows: repeat(13, 60px);
    grid-template-columns: repeat(12, 60px);
    /* margin: auto; */
    padding: 10px;
    font-size: 30px;
    font-weight: 700;
    cursor: grab;
    text-transform: capitalize;
    user-select: none;
  }

  .cell {
    width: 60px;
    height: 60px;
    background-color: var(--bg-2);
    display: flex;
    justify-content: center;
    border-radius: 0.25rem;
  }

  .filled {
    background-color: var(--bg-5);
  }
</style>