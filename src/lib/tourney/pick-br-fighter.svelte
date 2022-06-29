<script lang="ts">
  import { lastAction } from "$lib/stores";
  import { ownTeam, ownTeamIndex } from "$lib/tourney/stores";
  import EquipmentInfo from "$lib/tourney/equipment-info.svelte";
  import FighterInfo from "$lib/tourney/fighter-info.svelte";

  let selectedFighter: number;
  let selectedEquipment: boolean[] = Array($ownTeam.equipment.length).fill(false);

  function ready(): void {
    lastAction.set({
      type: "pickBRFighter",
      fighter: selectedFighter,
      equipment: selectedEquipment.map((x, i) => x ? i : -1).filter(x => x >= 0),
      strategy: {}
    });
  }
</script>
<div>
  {#if $ownTeamIndex !== null}
    <h2>Your fighters</h2>
    {#each $ownTeam.fighters as fighter, index}
      <FighterInfo {...fighter} {index} />
    {/each}
    <h2>Your equipment</h2>
    {#each $ownTeam.equipment as equipment, index}
      <EquipmentInfo {...equipment} {index} />
    {/each}
  {/if}
</div>

<div>
  {#if $ownTeamIndex !== null}
    <h2>Select fighter</h2>
    <select bind:value={selectedFighter}>
      {#each $ownTeam.fighters as fighter}
        <option value={fighter.name}>{fighter.name}</option>
      {/each}
    </select>

    <h2>Select equipment</h2>
    {#each $ownTeam.equipment as equipment, index}
    <label>
      {equipment.name} <input type="checkbox" bind:checked={selectedEquipment[index]} />
    </label>
    {/each}
    
    <button on:click={ready} on:submit={ready}>Ready!</button>
  {/if}
</div>

<style>
  select {
    flex: 0;
  }
</style>