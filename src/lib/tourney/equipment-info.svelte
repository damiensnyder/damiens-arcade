<script lang="ts">
  import type { Equipment, EquipmentSlot, FighterStats } from "$lib/tourney/types";

  export let equipment: Equipment;
  export let index: number;
  export let callback: (index: number) => void = (_: number) => {};

  function pick() {
    callback(index);
  }
</script>

<div class="horiz top-bar">
  <h3>{equipment.name}</h3>
  <button on:click={pick} on:submit={pick}>Pick</button>
</div>
<div class="horiz">
  <img src={equipment.imgUrl} width="150" height="150" alt={equipment.name} />
  <div class="horiz info">
    <div class="description">
      <p>{equipment.description}</p>
      <p>{equipment.flavor}</p>
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