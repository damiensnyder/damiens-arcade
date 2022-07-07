<script lang="ts">
  import { lastAction } from "$lib/stores";
  import type { FighterStats } from "$lib/tourney/types";
  import { StatName } from "$lib/tourney/types";
  import StarRating from "$lib/tourney/star-rating.svelte";
  import { draftOrder, ownTeamIndex, spotInDraftOrder } from "$lib/tourney/stores";

  export let name: string;
  export let stats: FighterStats;
  export let index: number;
  export let imgUrl: string;
  // svelte-ignore unused-export-let
  export let price: number = -1;
  export let description: string = "";
  export let flavor: string = "";
  // svelte-ignore unused-export-let
  export let yearsLeft: number;
  // svelte-ignore unused-export-let
  export let attunements: string[];

  function pick() {
    lastAction.set({
      type: "pick",
      index
    });
  }
</script>

<div class="horiz top-bar">
  <h3>{name}</h3>
  {#if $draftOrder[$spotInDraftOrder] === $ownTeamIndex}
    <button on:click={pick} on:submit={pick}>Pick</button>
  {/if}
</div>
<div class="horiz">
  <img src={imgUrl} width="150" height="150" alt={name} />
  <div class="horiz info">
    <div class="stats">
      {#each Object.entries(StatName) as statEntry}
        <div class="horiz stat-name">
          {statEntry[0]}&nbsp;<StarRating rating={stats[statEntry[1]]} />
        </div>
      {/each}
    </div>
    <div class="description">
      <p>{description}</p>
      <p>{flavor}</p>
    </div>
  </div>
</div>

<style>
  .top-bar {
    flex: 1;
    justify-content: space-between;
  }

  img {
    margin-right: 1rem;
  }
  
  h3 {
    padding: 0;
  }

  button {
    margin: 0.15rem 0 0 1rem;
  }

  .stats {
    align-items: stretch;
    margin: 0 0.5rem 0.5rem 0;
  }

  .stat-name {
    flex: 1;
    justify-content: space-between;
    text-transform: capitalize;
  }

  .info {
    align-items: stretch;
  }

  .description {
    flex: 1;
    justify-content: start;
    align-items: flex-start;
    margin: 0 0 0.5rem 0.5rem;
  }

  p {
    margin: 0 0 0.25rem 0;
  }

  p:last-child {
    margin: 0;
    font-style: italic;
  }
</style>