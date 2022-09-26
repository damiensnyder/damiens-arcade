<script lang="ts">
    import { lastAction } from "$lib/stores";
  import Bracket from "$lib/tourney/bracket.svelte";
  import { bracket, equipment, nextMatch, ownTeam, ownTeamIndex } from "$lib/tourney/stores";
    import { EquipmentSlot } from "./types";

  $: playingInNextGame = ($nextMatch.left.winner === $ownTeamIndex ||
       $nextMatch.right.winner === $ownTeamIndex) &&
      $nextMatch.winner === null;

  // by default, all pairs of fighter and equipment are false
  let equipmentChoices = $ownTeamIndex === null ? [] :
      $ownTeam.fighters.map(_ => $ownTeam.equipment.map(_ => false));

  function ready(): void {
    lastAction.set({
      type: "pickFighters",
      equipment: $ownTeam.fighters.map((_, i) =>
          equipmentChoices[i].flatMap((x, i2) => x ? [i2] : [])),
      strategy: $ownTeam.fighters.map(_ => ({}))
    });
  }

  function choicesAreValid(): string | true {
    for (let j = 0; j < $ownTeam.equipment.length; j++) {
      if (equipmentChoices.filter(f => f[j]).length > 1) {
        return `Multiple fighters using the same ${$ownTeam.equipment[j].name}.`;
      }
    }
    for (let i = 0; i < $ownTeam.fighters.length; i++) {
      const slotsTaken = equipmentChoices[i].flatMap((equipped, j) => {
        return equipped ? $ownTeam.equipment[j].slots : [];
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

<div class="horiz">
  {#if playingInNextGame}
    <!-- redundant check so validity updates whenever equipmentChoices updates -->
    {@const valid = equipmentChoices === equipmentChoices ? choicesAreValid() : true}
    <div>
      <h2>Assign equipment</h2>
      {#each $ownTeam.fighters as f, i}
        <div class="fighter">
          {f.name}
          <!-- {equipmentChoices[i]} -->
          {#each $ownTeam.equipment as e, j}
            <p class="equipment">
              <input type="checkbox"
                  bind:checked={equipmentChoices[i][j]}>
              {e.name}
            </p>
          {/each}
        </div>
      {/each}
      {#if valid === true}
        <button on:click={ready} on:submit={ready}>Ready</button>
      {:else}
        <p class="error">Cannot submit: {valid}</p>
      {/if}
    </div>
  {/if}
  <div>
    <h2>Bracket</h2>
    <Bracket {...$bracket} />
  </div>
</div>

<style>
  .fighter {
    margin: 1rem;
    padding: 0;
    align-items: flex-start;
  }
</style>