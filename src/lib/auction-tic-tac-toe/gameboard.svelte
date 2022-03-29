<script lang="ts">
  import { gamestate } from "$lib/stores";
</script>

<div class="outer">
  {#each [0, 1, 2] as x}
    {#each [0, 1, 2] as y}
      <div class="square">
        {$gamestate.squares[x][y]}
      </div>
    {/each}
  {/each}
</div>

<style>
  .outer {
    display: grid;
    grid-template-rows: repeat(3, 9rem);
    grid-template-columns: repeat(3, 9rem);
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