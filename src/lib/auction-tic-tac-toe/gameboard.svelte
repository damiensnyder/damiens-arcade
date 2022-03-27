<script lang="ts">
  import type { ActionCallback } from "$lib/types";
  import type { MidgameViewpoint } from "$lib/auction-tic-tac-toe/types";
  
  export let gamestate: MidgameViewpoint;
  export let callback: ActionCallback;
  
  const actionCallback: ActionCallback = (action) => {
    callback(action);
  };
</script>

<div class="outer">
  {#each [0, 1, 2] as x}
    {#each [0, 1, 2] as y}
      <div class="square">
        {gamestate.squares[x][y]}
      </div>
    {/each}
  {/each}
</div>

<style>
  .outer {
    display: grid;
    grid-template-rows: repeat(3, 8rem);
    grid-template-columns: repeat(3, 8rem);
    gap: 2px;
    background-color: var(--text-1);
  }

  .square {
    height: 100%;
    width: 100%;
    justify-content: center;
    background-color: var(--bg-1);
  }
</style>