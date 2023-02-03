<script lang="ts">
  import type { Equipment, EquipmentSlot, FighterStats } from "$lib/mayhem-manager/types";
  import { ownTeam } from "$lib/mayhem-manager/stores";
  import { slotsToString } from "./utils";
  import { lastAction } from "$lib/stores";
  import { gameStage } from "$lib/mayhem-manager/stores";

  export let equipment: Equipment;
  export let index: number = -1;
  export let callback: (index: number) => void = (_: number) => {};

  function pick(): void {
    if ($gameStage === "preseason") {
      lastAction.set({
        type: "repair",
        equipment: index
      });
    } else {
      callback(index);
    }
  }
</script>

<div class="horiz top-bar">
  <h3>{equipment.name}</h3>
  <div>
    {slotsToString(equipment.slots)}
    {#if index > -1} &bull; ${equipment.price}{/if}
  </div>
  {#if index > -1 &&
      $ownTeam.money > equipment.price}
    <button on:click={pick} on:submit={pick}>Pick</button>
  {/if}
</div>
<div class="horiz image-and-description">
  <img src={equipment.zoomedImgUrl} width="150" height="150" alt={equipment.name} />
  <div class="description">
    <p>{equipment.description}</p>
    <p>{equipment.flavor}</p>
  </div>
</div>

<style>
  .top-bar {
    flex: 1;
    align-self: stretch;
    justify-content: space-between;
    align-items: center;
  }

  .top-bar > div,
  .top-bar > button {
    flex-grow: 0;
  }

  .top-bar > div {
    margin-top: 0.5rem;
    margin-left: 1.25rem;
  }

  img {
    margin-right: 1rem;
  }
  
  h3 {
    flex: 1;
    padding: 0;
  }

  button {
    margin: 0.2rem 0 0 0.75rem;
  }

  .image-and-description {
    align-self: stretch;
    justify-content: stretch;
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