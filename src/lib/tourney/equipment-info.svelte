<script lang="ts">
  import { lastAction } from "$lib/stores";
  import type { FighterStats } from "$lib/tourney/types";
  import { StatName } from "$lib/tourney/types";

  export let name: string;
  // export let stats: FighterStats;
  // export let slot: EquipmentSlot;
  export let index: number;
  export let imgUrl: string;
  export let description: string;
  export let flavor: string;
  // export let price: number;
  // export let durability: number;

  function pick() {
    lastAction.set({
      type: "pick",
      index
    });
  }
</script>

<div class="horiz top-bar">
  <h3>{name}</h3>
  <button on:click={pick} on:submit={pick}>Pick</button>
</div>
<div class="horiz">
  <img src={imgUrl} width="150" height="150" alt={name} />
  <div class="horiz info">
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