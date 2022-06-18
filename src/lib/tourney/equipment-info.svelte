<script lang="ts">
  import { lastAction } from "$lib/stores";
  import type { FighterStats } from "$lib/tourney/types";
  import { StatName } from "$lib/tourney/types";

  export let name: string;
  export let stats: FighterStats;
  // export let slot: EquipmentSlot;
  export let index: number;
  export let imgUrl: string;
  // export let description?: string;
  // export let flavor?: string;
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
  <div class="horiz">
    <div>
      {#each Object.entries(StatName) as statEntry}
        <div class="horiz stat-name">
          {statEntry[0]}: {stats[statEntry[1]]}
        </div>
      {/each}
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

  .stat-name {
    flex: 1;
    justify-content: space-between;
    text-transform: capitalize;
  }
</style>