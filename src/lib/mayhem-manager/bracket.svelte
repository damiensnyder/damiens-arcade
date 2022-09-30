<script lang="ts">
  import type { Bracket } from "$lib/mayhem-manager/types";
  import { teams } from "$lib/mayhem-manager/stores";

  export let left: Bracket | null = null;
  export let right: Bracket | null = null;
  export let winner: number;
</script>

<div class="horiz">
  <div>
    {#if left !== null}
      <svelte:self {...left} />
    {/if}
    {#if right !== null}
      <svelte:self {...right} />
    {/if}
  </div>
  {#if winner !== null}
    <p class="winner">{$teams[winner].name}</p>
  {:else}
    <p class="winner tbd">winner</p>
  {/if}
</div>

<style>
  .winner {
    width: 6rem;
    padding: 0.5rem;
    text-align: right;
    border-right: 2px solid var(--bg-1);
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .tbd {
    color: var(--text-2);
    font-style: italic;
  }
</style>