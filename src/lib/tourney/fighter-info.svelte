<script lang="ts">
  import { lastAction } from "$lib/stores";
  import type { Equipment, Fighter } from "$lib/tourney/types";
  import { StatName } from "$lib/tourney/types";
  import StarRating from "$lib/tourney/star-rating.svelte";
  import { draftOrder, gameStage, ownTeam, ownTeamIndex, spotInDraftOrder } from "$lib/tourney/stores";
  import FighterImage from "$lib/tourney/fighter-image.svelte";

  export let fighter: Fighter;
  export let index: number = -1;
  export let equipment: Equipment[] = [];

  function pick(): void {
    if ($gameStage === "preseason") {
      lastAction.set({
        type: "resign",
        index
      });
    } else {
      lastAction.set({
        type: "pick",
        index
      });
    }
  }
</script>

<div class="horiz top-bar">
  <h3>{fighter.name}</h3>
  {#if index > -1 &&
      $draftOrder[$spotInDraftOrder] === $ownTeamIndex &&
      $ownTeam.money > fighter.price}
    <button on:click={pick} on:submit={pick}>Pick</button>
  {/if}
</div>
<div class="horiz">
  <FighterImage {fighter} {equipment} />
  <div class="horiz info">
    <div class="stats">
      {#each Object.entries(StatName) as statEntry}
        <div class="horiz stat-name">
          {statEntry[0]}&nbsp;<StarRating rating={fighter.stats[statEntry[1]]} />
        </div>
      {/each}
    </div>
    <div class="description">
      <p>{fighter.description}</p>
      <p>{fighter.flavor}</p>
    </div>
  </div>
</div>

<style>
  .top-bar {
    flex: 1;
    justify-content: space-between;
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