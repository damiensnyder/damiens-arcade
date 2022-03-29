<script lang="ts">
  import Square from "$lib/auction-tic-tac-toe/square.svelte";
</script>

<div class="outer">
  {#each [0, 1, 2] as x}
    {#each [0, 1, 2] as y}
      <Square x={x} y={y} />
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
</style>