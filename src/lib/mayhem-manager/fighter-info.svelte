<script lang="ts">
  import { lastAction } from "$lib/stores";
  import type { Equipment, Fighter, FighterStats, PreseasonTeam } from "$lib/mayhem-manager/types";
  import { StatName } from "$lib/mayhem-manager/types";
  import StarRating from "$lib/mayhem-manager/star-rating.svelte";
  import { draftOrder, gameStage, ownTeam, ownTeamIndex, spotInDraftOrder } from "$lib/mayhem-manager/stores";
  import FighterImage from "$lib/mayhem-manager/fighter-image.svelte";

  export let fighter: Fighter;
  export let index: number = -1;
  export let equipment: Equipment[] = [];

  $: isTurnToPick = index > -1 &&
      ($gameStage === "preseason" || $draftOrder[$spotInDraftOrder] === $ownTeamIndex);
  
  function tooltip(stat: StatName, value: number): string {
    value = Math.round(value);
    if (stat === StatName.Strength) {
      return `Deals ${0.5 + 0.1 * value}x base damage with melee weapons`;
    } else if (stat === StatName.Accuracy) {
      return `Hits ${25 + 5 * value}% of ranged attacks`;
    } else if (stat === StatName.Energy) {
      return `Takes ${9 - 0.6 * value} seconds to charge`;
    } else if (stat === StatName.Speed) {
      return `Moves ${2.5 + 0.5 * value} m/s; ${2 * value}% dodge chance on melee attacks`;
    } else {
      return `Incoming damage is multiplied by ${1.25 - 0.05 * value}`;
    }
  }

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
    {#if isTurnToPick}
      <button on:click={pick} on:submit={pick} disabled={$ownTeam.money < fighter.price}>Pick{#if fighter.price > 0}
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
        <div class="horiz stat-name" title={tooltip(statEntry[1], fighter.stats[statEntry[1]])}>
          {statEntry[1]}&nbsp;<StarRating rating={fighter.stats[statEntry[1]]} oldRating={(fighter.oldStats ?? fighter.stats)[statEntry[1]]} />
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