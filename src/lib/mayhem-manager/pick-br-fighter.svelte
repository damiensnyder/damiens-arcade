<script lang="ts">
  import { lastAction } from "$lib/stores";
  import { equipment, fighters, ownTeam, ownTeamIndex } from "$lib/mayhem-manager/stores";
  import EquipmentInfo from "$lib/mayhem-manager/equipment-info.svelte";
  import FighterInfo from "$lib/mayhem-manager/fighter-info.svelte";
  import { slotsToString } from "$lib/mayhem-manager/utils";
  import { EquipmentSlot } from "$lib/mayhem-manager/types";

  let selectedFighter: number = 0;
  let selectedEquipment: boolean[] = $ownTeamIndex === null ? [] : Array($ownTeam.equipment.length).fill(false);

  $: slotsTaken = selectedEquipment.flatMap((e, i) => {
    return e ? $ownTeam.equipment[i].slots : [];
  });

  function ready(): void {
    lastAction.set({
      type: "pickBRFighter",
      fighter: selectedFighter,
      equipment: selectedEquipment.flatMap((x, i) => x ? [i] : []),
      strategy: {}
    });
  }
</script>
{#if $ownTeamIndex !== null}
  <div>
    <h2>Select fighter</h2>
    <select bind:value={selectedFighter}>
      {#each $ownTeam.fighters as fighter, index}
        <option value={index}>{fighter.name}</option>
      {/each}
    </select>
    <div>
      <FighterInfo fighter={$ownTeam.fighters[selectedFighter]}
          equipment={$ownTeam.equipment.filter((_, i) => selectedEquipment[i])} />
    </div>
  </div>
  <div>
    <h2>Your equipment</h2>
    {#each $ownTeam.equipment as equipment, index}
      <div class="show-child-on-hover horiz">
        <span>{equipment.name} ({slotsToString(equipment.slots)})</span>
        <div class="show-on-hover">
          <EquipmentInfo {equipment} />
        </div>
        <input type="checkbox" bind:checked={selectedEquipment[index]} />
      </div>
    {/each}
    {#if slotsTaken.filter(s => s === "hand").length > 2}
      <p>Cannot submit: Equipment chosen takes up more than 2 hands.</p>
    {:else if slotsTaken.filter(s => s === "head").length > 1}
      <p>Cannot submit: Too many equipment chosen that take up the head.</p>
    {:else if slotsTaken.filter(s => s === "torso").length > 1}
      <p>Cannot submit: Too many equipment chosen that take up the torso.</p>
    {:else if slotsTaken.filter(s => s === "legs").length > 1}
      <p>Cannot submit: Too many equipment chosen that take up the legs.</p>
    {:else if slotsTaken.filter(s => s === "feet").length > 1}
      <p>Cannot submit: Too many equipment chosen that take up the feet.</p>
    {:else}
      <button on:click={ready} on:submit={ready}>Ready</button>
    {/if}
  </div>
{/if}

<style>
  select {
    flex: 0;
  }

  .show-child-on-hover {
    align-self: stretch;
    justify-content: space-between;
  }

  input[type="checkbox"] {
    margin: 0.15rem 0.6rem 0;
  }
</style>