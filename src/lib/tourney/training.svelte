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
    <div class="list-container">
    {#each $ownTeam.fighters as fighter, index}
      <div class="show-child-on-hover">
        {fighter.name}
        <div class="show-on-hover">
          <FighterInfo {fighter} />
        </div>
      </div>
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
    </div>

    <button on:click={practice} on:submit={practice}>Ready!</button>

    <h2>Your equipment</h2>

    <div class="list-container">
      {#each $ownTeam.equipment as equipment}
        <div class="show-child-on-hover">
          {equipment.name}
          <div class="show-on-hover">
            <EquipmentInfo {equipment} />
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .fighters {
    flex: 1;
    align-items: stretch;
  }

  select {
    flex: 0;
    margin: 0.5rem 0;
    padding-bottom: 0.35rem;
  }

  .list-container {
    align-self: stretch;
    padding-top: 1rem;
    align-items: flex-start;
  }

  .show-child-on-hover {
    position: relative;
  }

  .show-child-on-hover > .show-on-hover {
    visibility: hidden;
    opacity: 0;
  }

  .show-child-on-hover:hover > .show-on-hover {
    visibility: visible;
    opacity: 100%;
    transition: all ease-in-out 0.2s;
  }

  .show-on-hover {
    position: absolute;
    top: 0;
    left: -17.5rem;
    right: 0;
    width: fit-content;
    z-index: 1;
    padding: 0 1rem;
    border: 2px solid var(--bg-fun-2);
    border-radius: 1rem;
    background-color: var(--bg-fun-4);
  }
</style>