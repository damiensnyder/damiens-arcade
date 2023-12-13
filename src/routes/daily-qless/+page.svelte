<script lang="ts">
  import "../../styles/global.css";
  import "../../styles/techno.css";

  export let data: {
    legalWords: string[],
    roll: string
  };
  
  let grid: string[][] = [...Array(11)].map(_ => Array(12).fill(""));
  grid[0].splice(4, 4, ...data.roll.substring(0, 4).split(""));
  grid[1].splice(4, 4, ...data.roll.substring(4, 8).split(""));
  grid[2].splice(4, 4, ...data.roll.substring(8, 12).split(""));
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
      getAllWords();
      checkForWin();
    }
  }

  let words: WordInGrid[] = [];
  let isLegal: boolean[][] = [...Array(11)].map(_ => Array(12).fill(false));

  function getAllWords(): void {
    const newWords = [];
    for (let x = 0; x < 11; x++) {
      let currentWord = "";
      for (let y = 0; y < 12; y++) {
        if (grid[x][y] !== "") {
          currentWord += grid[x][y];
        } else {
          if (currentWord.length > 1) {
            newWords.push({
              word: currentWord,
              starts: [x, y - currentWord.length],
              down: false
            });
          }
          currentWord = "";
        }
      }
      if (currentWord.length > 1) {
        newWords.push({
          word: currentWord,
          starts: [x, 12 - currentWord.length],
          down: false
        });
      }
    }
    for (let y = 0; y < 12; y++) {
      let currentWord = "";
      for (let x = 0; x < 11; x++) {
        if (grid[x][y] !== "") {
          currentWord += grid[x][y];
        } else {
          if (currentWord.length > 1) {
            newWords.push({
              word: currentWord,
              starts: [x - currentWord.length, y],
              down: true
            });
          }
          currentWord = "";
        }
      }
      if (currentWord.length > 1) {
        newWords.push({
          word: currentWord,
          starts: [11 - currentWord.length, y],
          down: true
        });
      }
    }
    words = newWords;
  }
  
  function checkForWin(): void {
    let illegalWordFound = false;
    const newIsLegal = [...Array(11)].map(_ => Array(12).fill(false));
    for (const word of words) {
      if (data.legalWords.includes(word.word)) {
        if (word.down) {
          for (let x = 0; x < word.word.length; x++) {
            newIsLegal[x + word.starts[0]][word.starts[1]] = true;
          }
        } else {
          for (let y = 0; y < word.word.length; y++) {
            newIsLegal[word.starts[0]][y + word.starts[1]] = true;
          }
        }
      } else {
        illegalWordFound = true;
      }
    }
    isLegal = newIsLegal;

    let firstX = 0;
    let firstY = 0;
    while (grid[firstX][firstY] === "") {
      firstY++;
      if (firstY == 12) {
        firstY = 0;
        firstX++;
      }
    }

    let explored = []
    let frontier = [[firstX, firstY]];
    let cycles = 0;
    while (frontier.length > 0) {
      const newFrontier = [];
      for (let coord of frontier) {
        for (let newCoord of [[coord[0] + 1, coord[1]], [coord[0] - 1, coord[1]], [coord[0], coord[1] + 1], [coord[0], coord[1] - 1]]) {
          if (newCoord[0] >= 0 && newCoord[0] < 11 && newCoord[1] >= 0 && newCoord[1] <= 12 &&
              grid[newCoord[0]][newCoord[1]] !== "" &&
              explored.concat(frontier).every((coord2) => newCoord[0] !== coord2[0] || newCoord[1] != coord2[1])) {
            newFrontier.push(newCoord);
          }
        }
      }
      cycles++;
      if (cycles > 12) break;
      explored = explored.concat(frontier);
      frontier = newFrontier;
    }

    console.log(words);

    if (explored.length === 12) {
      // win
    }
  }
</script>
  
<svelte:head>
  <title>Damien's Arcade | Daily Q-less</title>
</svelte:head>

<h1>Daily Q-less</h1>

{@debug words}

<div class="grid-outer">
  <div class="grid-inner"
      on:dragover|preventDefault={() => {}}>
    {#each shownGrid as row, x}
      {#each row as cell, y}
        <div class={(cell === "" ? "cell" : "cell filled") + (isLegal[x][y] ? " legal" : "")}
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
    max-width: 70vw;
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

  .legal {
    color: var(--accent-1);
  }
</style>