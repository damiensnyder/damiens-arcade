<script lang="ts">
  import type { Bracket } from "$lib/mayhem-manager/types";
  import { ownTeam, ownTeamIndex, teams } from "$lib/mayhem-manager/stores";

  export let left: Bracket | null = null;
  export let right: Bracket | null = null;
  export let winner: number | string;

  const winnerShortenedName = (
    typeof winner === "string" ? winner : $teams[winner].name
  ).split(" ").pop();
  const isOwnTeam = typeof winner === "string" ?
      $ownTeam !== null && winner === $ownTeam.name :
      winner === $ownTeamIndex;
</script>

<div class="horiz">
  <div class="children">
    {#if left !== null}
      <svelte:self {...left} />
    {/if}
    {#if right !== null}
      <svelte:self {...right} />
    {/if}
  </div>
  {#if winner !== null}
    <p class="winner" style:color={isOwnTeam ? "var(--accent-4)" : "var(--text-1)"}>
      {winnerShortenedName}
    </p>
  {:else}
    <p class="winner tbd">winner</p>
  {/if}
</div>

<style>
  .children {
    align-items: flex-end;
  }

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