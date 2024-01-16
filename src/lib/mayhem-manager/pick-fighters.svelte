<script lang="ts">
  import { lastAction } from "$lib/stores";
  import EquipmentInfo from "$lib/mayhem-manager/equipment-info.svelte";
  import FighterInfo from "$lib/mayhem-manager/fighter-info.svelte";
  import { ownTeam, equipmentChoices } from "$lib/mayhem-manager/stores";
  import { EquipmentSlot } from "$lib/mayhem-manager/types";
  import { slotsToString } from "$lib/mayhem-manager/utils";
  import FighterImage from "$lib/mayhem-manager/fighter-image.svelte";

  function ready(): void {
    lastAction.set({
      type: "pickFighters",
      equipment: $ownTeam.fighters.map((_, i) =>
          $equipmentChoices.map((ec, j) => ec === i ? j : -1).filter(ec => ec >= 0))
    });
  }

  function choicesAreValid(): string | true {
    for (let i = 0; i < $ownTeam.fighters.length; i++) {
      const slotsTaken = $equipmentChoices.flatMap((ec, j) => {
        return ec === i ? $ownTeam.equipment[j].slots : [];
      });
      if (slotsTaken.filter(s => s === EquipmentSlot.Head).length > 1) {
        return `${$ownTeam.fighters[i].name} has multiple items on their head.`
      } else if (slotsTaken.filter(s => s === EquipmentSlot.Hand).length > 2) {
        return `${$ownTeam.fighters[i].name} has more than two items in their hands.`
      } else if (slotsTaken.filter(s => s === EquipmentSlot.Torso).length > 1) {
        return `${$ownTeam.fighters[i].name} has multiple items on their torso.`
      } else if (slotsTaken.filter(s => s === EquipmentSlot.Legs).length > 1) {
        return `${$ownTeam.fighters[i].name} has multiple items on their legs.`
      } else if (slotsTaken.filter(s => s === EquipmentSlot.Feet).length > 1) {
        return `${$ownTeam.fighters[i].name} has multiple items on their feet.`
      }
    }
    return true;
  }
</script>

<div class="assign-equipment column" style:flex=2>
  <h2 class="column-title">Assign equipment</h2>
  <div class="fighters-container">
    {#each $ownTeam.fighters as fighter, i}
      <div class="fighter">
        <div class="show-child-on-hover">
          <FighterImage {fighter} equipment={$equipmentChoices.flatMap((ec, j) => {
            if (ec === i) return $ownTeam.equipment[j];
            return [];
          })} />
          <div class="show-on-hover">
            <FighterInfo {fighter} />
          </div>
        </div>
      </div>
    {/each}
  </div>
  {#each $ownTeam.equipment as equipment, i}
    <div class="show-child-on-hover horiz">
      <span>{equipment.name} ({slotsToString(equipment.slots)})</span>
      <div class="show-on-hover">
        <EquipmentInfo equipment={equipment} />
      </div>
      <select bind:value={$equipmentChoices[i]}>
        <option value={-1}>no one</option>
        {#each $ownTeam.fighters as f, j}
          <option value={j}>
            {f.name}
            {f.attunements.includes(equipment.name) ? " (attuned)" : ""}
          </option>
        {/each}
      </select>
    </div>
  {/each}
  {#if choicesAreValid() === true}
    <button class="ready" on:click={ready} on:submit={ready}>Ready</button>
  {:else}
    <p class="error">Cannot submit: {choicesAreValid()}</p>
  {/if}
</div>

<style>
  .column {
    overflow-x: hidden;
  }

  .fighters-container {
    flex-flow: wrap;
  }
  
  .fighter {
    max-width: 50%;
    margin: 0;
    padding: 0;
  }

  .show-child-on-hover {
    align-self: stretch;
    justify-content: space-between;
  }

  .show-on-hover {
    left: unset;
    right: 1rem;
  }

  .ready {
    margin-bottom: 1.25rem;
  }

  select {
    min-width: auto;
  }
</style>