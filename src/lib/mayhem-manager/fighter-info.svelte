<script lang="ts">
  import { lastAction } from "$lib/stores";
  import type { Equipment, Fighter, PreseasonTeam } from "$lib/mayhem-manager/types";
  import { StatName } from "$lib/mayhem-manager/types";
  import StarRating from "$lib/mayhem-manager/star-rating.svelte";
  import { draftOrder, gameStage, ownTeam, ownTeamIndex, spotInDraftOrder, teams } from "$lib/mayhem-manager/stores";
  import FighterImage from "$lib/mayhem-manager/fighter-image.svelte";

  export let fighter: Fighter;
  export let index: number = -1;
  export let equipment: Equipment[] = [];

  $: canPick = index > -1 &&
      ($gameStage === "preseason" || $draftOrder[$spotInDraftOrder] === $ownTeamIndex) &&
      $ownTeam.money >= fighter.price

  function pick(): void {
    if ($gameStage === "preseason") {
      lastAction.set({
        type: "resign",
        fighter: index
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
  <div class="horiz">
    <span class="age">age {20 + fighter.experience}</span>
    {#if canPick}
      <button on:click={pick} on:submit={pick}>Pick{#if fighter.price > 0}
      : ${fighter.price}
      {/if}</button>
    {/if}
  </div>
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
    align-self: stretch;
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

  .age {
    margin-top: 0.25rem;
  }
</style>