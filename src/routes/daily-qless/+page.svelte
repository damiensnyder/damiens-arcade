<script lang="ts">
  import { onMount } from "svelte";
  import "../../styles/global.css";
  import "../../styles/techno.css";

  let grid: string[][] = [...Array(11)].map((_, i) => Array(12).fill(""));
  grid[0].splice(4, 4, "a", "b", "b", "c");
  grid[1].splice(4, 4, "d", "f", "h", "n");
  grid[2].splice(4, 4, "o", "o", "p", "w");
  let shownGrid: string[][] = grid.map(row => row.slice());

  let dragging: { x: number, y: number } = { x: -1, y: -1 };
  let over: { x: number, y: number } = { x: -1, y: -1 };

  function handleDragStart(e: DragEvent): void {
    dragging = this;
  }

  function handleDragOver(e: DragEvent): void {
    if (dragging.x !== -1 && shownGrid[this.x][this.y] === "") {
      const prevOver = over;
      over = this;
      shownGrid[dragging.x][dragging.y] = "";
      shownGrid[prevOver.x][prevOver.y] = "";
      shownGrid[this.x][this.y] = grid[dragging.x][dragging.y];
    }
  }

  function handleDragEnd(e: DragEvent): void {
    grid[over.x][over.y] = grid[dragging.x][dragging.y];
    grid[dragging.x][dragging.y] = "";
    dragging = { x: -1, y: -1 };
    over = { x: -1, y: -1 };
    shownGrid = grid.map(row => row.slice());
    checkForWin();
  }
  
  function checkForWin(): void {

  }
</script>
  
<svelte:head>
  <title>Damien's Arcade | Daily Q-less</title>
</svelte:head>

<h1>Daily Q-less</h1>

<div class="grid-outer">
  <div class="grid-inner"
      on:dragover|preventDefault={() => {}}>
    {#each shownGrid as row, x}
      {#each row as cell, y}
        <div class={cell === "" ? "cell" : "cell filled"}
            style:grid-area={`${x + 1} / ${y + 1}`}
            draggable={grid[x][y] !== ""}
            on:dragstart={handleDragStart.bind({ x, y })}
            on:dragenter={handleDragOver.bind({ x, y })}
            on:dragend={handleDragEnd}
            on:dragover|preventDefault={() => {}}>
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
    background-color: var(--bg-1);
  }

  .grid-inner {
    display: grid;
    gap: 15px;
    grid-template-rows: repeat(11, 60px);
    grid-template-columns: repeat(12, 60px);
    padding: 12px;
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