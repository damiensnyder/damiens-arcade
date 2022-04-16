<script lang="ts">
  import Square from "$lib/auction-tic-tac-toe/square.svelte";
  import { gameStatus, winner } from "$lib/auction-tic-tac-toe/stores";
  import { Side } from "$lib/auction-tic-tac-toe/types";
import { winningSide } from "./utils";
</script>

<div class="outer">
  {#each [0, 1, 2] as x}
    {#each [0, 1, 2] as y}
      <Square x={x} y={y} />
    {/each}
  {/each}
  {#if $gameStatus === "postgame" && $winner.winningSide !== Side.None}
    <svg viewBox="0 0 300 300">
      <line x1={$winner.start[1] === $winner.end[1] ? 50 + 100 * $winner.start[1] : 10 + 140 * $winner.start[1]}
            y1={$winner.start[0] === $winner.end[0] ? 50 + 100 * $winner.start[0] : 10 + 140 * $winner.start[0]}
            x2={$winner.start[1] === $winner.end[1] ? 50 + 100 * $winner.end[1] : 10 + 140 * $winner.end[0]}
            y2={$winner.start[0] === $winner.end[0] ? 50 + 100 * $winner.end[0] : 10 + 140 * $winner.end[0]}
            stroke={$winner.winningSide === Side.X ? "#d48" : "#3bd"}
            stroke-width={3} />
    </svg>
    <div class="winner-name">
      <span>{$winner.winningSide} wins!</span>
    </div>
  {:else if $gameStatus === "postgame"}
    <div class="winner-name">
      <span style="border-color: var(--bg-5);">It's a draw.</span>
    </div>
  {/if}
</div>

<style>
  .outer {
    position: relative;
    display: grid;
    grid-template-rows: repeat(3, 9rem);
    grid-template-columns: repeat(3, 9rem);
    gap: 2px;
    background-color: var(--text-1);
  }

  svg {
    position: absolute;
    top: -1px;
    bottom: -1px;
    left: -1px;
    right: -1px;
    z-index: 1;
  }

  .winner-name {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    justify-content: center;
    align-items: center;
  }
  
  span {
    z-index: 2;
    padding: 0.5rem 0.5rem 0.3rem;
    font-size: 1.4rem;
    border: 2px solid var(--accent-1);
    border-radius: 8px;
    color: var(--text-2);
    background-color: var(--bg-3);
    opacity: 90%;
  }
</style>