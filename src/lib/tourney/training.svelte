<script lang="ts">
  import { lastAction } from "$lib/stores";
  import { equipment, fighters, ownTeam, ownTeamIndex, spotInDraftOrder, teams } from "$lib/tourney/stores";
  import EquipmentInfo from "$lib/tourney/equipment-info.svelte";
  import FighterInfo from "$lib/tourney/fighter-info.svelte";
  import { StatName, type FighterStats } from "$lib/tourney/types";

  let equipmentBought: number[] = [];
  let skills: (keyof FighterStats | number)[] = $ownTeamIndex === null ? [] :
      Array($ownTeam.fighters.length).fill("toughness");

  function pick(index: number) {
    equipmentBought.push(index);
    $ownTeam.equipment.push($equipment.splice(index, 1)[0]);
    // $ownTeam = $ownTeam;  // so the store knows it was updated
    // $equipment = $equipment;
    teams.update(x => x);
    equipment.update(x => x);
  }

  function practice() {
    lastAction.set({
      type: "practice",
      equipment: equipmentBought,
      skills
    });
  }
</script>

<div>
  <h2>Equipment</h2>
  <div class="fighters">
    {#each $equipment as equipment, index}
      <EquipmentInfo {equipment} {index} callback={pick} />
    {/each}
  </div>
</div>
<div>
  {#if $ownTeamIndex !== null}
    <h2>Select training</h2>
    {#each $ownTeam.fighters as fighter, index}
      {fighter.name}:
      <select bind:value={skills[index]}>
        <optgroup label="Improve a skill">
          {#each Object.values(StatName) as stat}
            <option value={stat}>{stat}</option>
          {/each}
        </optgroup>
        <optgroup label="Attune to an equipment">
          {#each $ownTeam.equipment as equipment}
            <option value={equipment.name}>{equipment.name}</option>
          {/each}
        </optgroup>
      </select>
    {/each}

    <button on:click={practice} on:submit={practice}>Ready!</button>

    <h2>Your equipment</h2>
    {#each $ownTeam.equipment as equipment}
      <div>
        {equipment.name}
      </div>
    {/each}
  {/if}
</div>

<style>
  .fighters {
    flex: 1;
    align-items: stretch;
  }

  select {
    flex: 0;
  }
</style>