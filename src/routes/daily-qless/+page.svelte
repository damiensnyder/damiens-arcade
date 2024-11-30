<script lang="ts">
  import { onMount } from "svelte";
  import "../../styles/global.css";
  import "../../styles/techno.css";
  import { goto } from "$app/navigation";
  import { gameIsWon, getAllWords, getBadges, gridIsLegal } from "$lib/daily-qless/utils";

  export let data: QlessProps;

  let roll: string;
  let legalWords: string[];
  if (new Date().getDate() === data.date1) {
    roll = data.roll1;
    legalWords = data.legalWords1;
  } else if (new Date().getDate() === data.date2) {
    roll = data.roll2;
    legalWords = data.legalWords2;
  } else {
    roll = data.roll3;
    legalWords = data.legalWords3;
  }
  let grid: string[][] = [...Array(11)].map(_ => Array(12).fill(""));
  grid[0].splice(4, 4, ...roll.substring(0, 4).split(""));
  grid[1].splice(4, 4, ...roll.substring(4, 8).split(""));
  grid[2].splice(4, 4, ...roll.substring(8, 12).split(""));
  let shownGrid: string[][] = grid.map(row => row.slice());

  let startTime: number;
  let solveTime: number;
  let showWin: boolean = false;
  let showInstructions: boolean = false;

  let outerEl: HTMLDivElement;
  let innerEl: HTMLDivElement;
  let dragging: Coordinate = { x: -1, y: -1 };
  let over: Coordinate = { x: -1, y: -1 };
  let touching: boolean = false;
  let draggingCoords: Coordinate = { x: -1, y: -1 };

  onMount(() => {
    words = getAllWords(grid);
    checkForWin();
    innerEl.children[7].scrollIntoView();
    startTime = new Date().getTime();
  });

  function handleDragStart(e: DragEvent): void {
    dragging = this;
  }

  function handleDragOver(e: DragEvent): void {
    if (dragging.x !== -1 && shownGrid[this.x][this.y] === "") {
      const prevOver = over;
      over = this;
      shownGrid[dragging.x][dragging.y] = "";
      if (prevOver.x !== -1) {
        shownGrid[prevOver.x][prevOver.y] = "";
      }
      shownGrid[this.x][this.y] = grid[dragging.x][dragging.y];
    }
  }

  function handleDragEnd(e: DragEvent): void {
    if (over.x !== dragging.x || over.y !== dragging.y) {
      grid[over.x][over.y] = grid[dragging.x][dragging.y];
      grid[dragging.x][dragging.y] = "";
      dragging = { x: -1, y: -1 };
      over = { x: -1, y: -1 };
      shownGrid = grid.map(row => row.slice());
      words = getAllWords(grid);
      checkForWin();
    }
  }

  function handleTouchStart(e: TouchEvent): void {
    if (grid[this.x][this.y] !== "") {
      e.preventDefault();
      dragging = this;
      touching = true;
      shownGrid[dragging.x][dragging.y] = "";
      draggingCoords = {
        x: e.targetTouches[0].pageX,
        y: e.targetTouches[0].pageY
      };
    }
  }

  function handleTouchMove(e: TouchEvent): void {
    draggingCoords = {
      x: e.targetTouches[0].pageX,
      y: e.targetTouches[0].pageY
    };
  }

  // check if rect contains coords, allowing 5px of leeway
  function rectContains(rect: DOMRect, coords: Coordinate): boolean {
    return rect.x - 5 <= coords.x
        && rect.y - 5 <= coords.y
        && rect.x + rect.width + 5 >= coords.x
        && rect.y + rect.height + 5 >= coords.y;
  }

  function handleTouchEnd(e: TouchEvent): void {
    touching = false;

    // ignore drag unless we find a legal cell it ended in
    over = dragging;
    // only check coords within outer grid
    if (rectContains(outerEl.getBoundingClientRect(), draggingCoords)) {
      // check which child the drag ends in
      for (let i = 0; i < innerEl.children.length; i++) {
        // only check non-touch cells
        if (innerEl.children[i].classList.contains("cell") &&
            !innerEl.children[i].classList.contains("touch")) {
          const boundingRect = innerEl.children[i].getBoundingClientRect();
          // if touch ended in cell, infer which cell it was from style. which is horrible, but what isn't
          // then break because we know it can only be one cell
          if (rectContains(boundingRect, draggingCoords)) {
            over = {
              // @ts-ignore
              x: innerEl.children[i].style['grid-row-start'] - 1,
              // @ts-ignore
              y: innerEl.children[i].style['grid-column-start'] - 1
            };
            break;
          }
        }
      }
    }
    // reset to pre-drag state if the cell dragged over isn't empty
    if (grid[over.x][over.y] === "") {
      grid[over.x][over.y] = grid[dragging.x][dragging.y];
      grid[dragging.x][dragging.y] = "";
      dragging = { x: -1, y: -1 };
      over = { x: -1, y: -1 };
      shownGrid = grid.map(row => row.slice());
      words = getAllWords(grid);
      checkForWin();
    } else {
      dragging = { x: -1, y: -1 };
      over = { x: -1, y: -1 };
      shownGrid = grid.map(row => row.slice());
    }
  }

  let words: WordInGrid[] = [];
  let isLegal: boolean[][] = [...Array(11)].map(_ => Array(12).fill(false));
  let badges: Badge[];

  function checkForWin(): void {
    const legality = gridIsLegal(legalWords, words);
    isLegal = legality.gridLegality;
    if (!legality.illegalWordFound && gameIsWon(grid)) {
      solveTime = (new Date().getTime() - startTime) / 1000;
      showWin = true;
      badges = getBadges(grid, words, solveTime);
    }
  }

  async function share(): Promise<void> {
    let solveString = "Solved!";
    let badgeString = "";
    if (solveTime <= 600) {
      solveString = "Solved in " + `${Math.floor(solveTime / 60)}:${Math.round(solveTime % 60) < 10 ? "0" : ""}${Math.round(solveTime % 60)}`;
    }
    if (badges.length > 0) {
      badgeString = "\nBadges: " + badges.map(b => b.name + " " + b.icon).join(", ");
    }
    const shareData = {
      url: "https://arcade.damiensnyder.com/daily-qless",
      title: "Daily Q-less solution",
      text: `Daily Q-less for ${new Date(startTime).toLocaleString().split(",")[0]}\n${solveString}${badgeString}`
    };
    try {
      if (navigator.canShare) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.text);
      }
    } catch (e) {
      // darn
    }
  }
</script>
  
<svelte:head>
  <title>Damien's Arcade | Daily Q-less</title>
</svelte:head>

<div class="horiz mobile-only header">
  <h1>Daily Q-less</h1>
  <button on:click={() => { showInstructions = true; }}
      on:submit={() => { showInstructions = true; }}
      style:margin={"0.5rem -1rem 0 1rem"}
      disabled={showInstructions || showWin}>
    How to play
  </button>
</div>

<h1 class="desktop-only">Daily Q-less</h1>

<div class="grid-outer"
    bind:this={outerEl}>
  <div class="grid-inner"
      bind:this={innerEl}
      on:dragover|preventDefault={() => {}}>
    {#each shownGrid as row, x}
      {#each row as cell, y}
        <div class={(cell === "" ? "cell" : "cell filled") + (isLegal[x][y] ? " legal" : "")}
            style:grid-area={`${x + 1} / ${y + 1}`}
            draggable={grid[x][y] !== ""}
            on:dragstart={handleDragStart.bind({ x, y })}
            on:dragenter={handleDragOver.bind({ x, y })}
            on:dragend={handleDragEnd}
            on:dragover|preventDefault={() => {}}
            on:touchstart={handleTouchStart.bind({ x, y })}
            on:touchmove={handleTouchMove}
            on:touchend|preventDefault={handleTouchEnd}>
          {cell}
        </div>
      {/each}
    {/each}

    {#if touching}
      <div class="cell filled touch"
          style:transform={`translate(${draggingCoords.x - 20}px, ${draggingCoords.y - 20}px)`}>
        {grid[dragging.x][dragging.y]}
      </div>
    {/if}
  </div>
</div>

<button class="desktop-only"
    on:click={() => { showInstructions = true; }}
    on:submit={() => { showInstructions = true; }}
    disabled={showInstructions || showWin}>
  How to Play
</button>

{#if showInstructions}
  <div class="dialog-outer">
    <div class="dialog">
      <h2>How to Play</h2>

      <ul>
        <li>Drag the letters around the grid to make a crossword</li>
        <li>All words must be 3 letters or longer</li>
        <li>No abbreviations or proper nouns</li>
        <li>If a word is legal the letters will light up</li>
      </ul>

      <button on:click={() => { showInstructions = false; }}
          on:submit={() => { showInstructions = false; }}>
        Got it
      </button>
    </div>
  </div>
{/if}

{#if showWin}
  <div class="dialog-outer">
    <div class="dialog">
      <h2>You won!</h2>

      {#if solveTime < 600}
        <p>And it only took you</p>
        <h1 style:margin={"0.75rem"}>
          {Math.floor(solveTime / 60)}:{Math.round(solveTime % 60) < 10 ? "0" : ""}{Math.round(solveTime % 60)}
        </h1>
      {/if}

      {#if badges}
        <div class="badges-outer">
          {#each badges as badge}
            <div class="horiz">
              <div class="badge-icon">{badge.icon}</div>
              <div>
                <h3 class="badge-name">{badge.name}</h3>
                <p class="badge-description">{badge.description}</p>
              </div>
            </div>
          {/each}
        </div>
      {/if}

      <p>Want to play again? Wait until tomorrow or <a href="https://q-lessgame.com/" target="_blank" rel="noopener noreferrer">buy the real game</a>.</p>

      <div class="horiz">
        <button on:click={() => { goto("/"); }}
            on:submit={() => { goto("/"); }}>
          Go to Homepage
        </button>
        <button on:click={share}
            on:submit={share}>
          Share
        </button>
        <button on:click={() => { showWin = false; }}
            on:submit={() => { showWin = false; }}>
          Close
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .grid-outer {
    max-width: 70vw;
    max-height: 60vh;
    margin: 2rem;
    display: flex;
    justify-content: flex-start;
    align-items: safe center;
    overflow-x: scroll;
    overflow-y: scroll;
    border-radius: 0.75rem;
    background-color: var(--bg-1);
  }

  .grid-inner {
    margin: auto; /* because safe center doesn't work on safari */
    display: grid;
    gap: 0.75rem;
    grid-template-rows: repeat(11, 3rem);
    grid-template-columns: repeat(12, 3rem);
    padding: 0.6rem;
    font-size: 1.5rem;
    font-weight: 700;
    text-transform: capitalize;
    user-select: none;
  }

  .cell {
    width: 3rem;
    height: 3rem;
    background-color: var(--bg-2);
    display: flex;
    justify-content: center;
    border-radius: 0.25rem;
  }

  .filled {
    background-color: var(--bg-5);
    cursor: grab;
  }

  .touch {
    position: fixed;
    top: 0;
    left: 0;
    z-index: 1;
  }

  .legal {
    color: var(--accent-1);
  }

  .dialog-outer {
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1;
    background-color: rgba(0, 0, 0, 0.1);
  }

  .dialog {
    padding: 3rem;
    font-size: 1rem;
    background-color: var(--bg-3);
    opacity: 95%;
    border: 2px solid var(--text-2);
    border-radius: 2rem;
    z-index: 2;
  }

  ul,
  p {
    margin: 1rem;
    font-size: 1.2rem;
  }

  li {
    margin: 0.5rem;
  }

  button {
    font-size: 1.2rem;
    margin: 0.5rem;
  }

  .mobile-only {
    visibility: hidden;
    position: unset;
    display: none;
  }

  .header {
    width: 100%;
    justify-content: space-evenly;
    align-items: center;
  }

  .badges-outer {
    align-items: stretch;
  }

  .badge-icon {
    font-size: 2.5rem;
    margin: 0 0.75rem 0.25rem 1rem;
  }

  .badge-name {
    align-self: flex-start;
    margin-left: 1rem;
    margin-bottom: 0;
  }

  .badge-description {
    align-self: flex-start;
    margin-top: 0.75rem;
  }

  @media only screen and (max-width: 720px) {
    .grid-outer {
      max-width: 95vw;
      max-height: 75vh;
      margin: 0 0 0.75rem 0;
    }

    h1 {
      margin: 1.5rem 0 1rem 0;
    }

    .dialog {
      padding: 1rem 0.25rem;
    }

    ul,
    p {
      margin: 0.75rem;
    }

    .desktop-only {
      visibility: hidden;
      position: unset;
      display: none;
    }

    .mobile-only {
      visibility: visible;
      position: relative;
      display: flex;
    }
  }

  @media only screen and (min-width: 720px) and (max-width: 1200px) {
    .grid-outer {
      max-width: 85vw;
      max-height: 80vh;
      margin: 1rem;
    }

    h1 {
      margin: 2rem 0 0.75rem 0;
    }

    .dialog {
      padding: 1.25rem 0.5rem;
    }

    ul,
    p {
      margin: 1rem;
    }
  }
</style>