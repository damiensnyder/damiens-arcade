<script lang="ts">
  import { lastAction } from "$lib/stores";
  import { draftOrder, equipment, fighters, ownTeam, ownTeamIndex, spotInDraftOrder, teams } from "$lib/tourney/stores";
  import EquipmentInfo from "$lib/tourney/equipment-info.svelte";
  import FighterInfo from "$lib/tourney/fighter-info.svelte";
  import type { FighterStats } from "$lib/tourney/types";

  let skills: (keyof FighterStats | number)[] = $ownTeamIndex === null ? [] :
      Array($ownTeam.fighters.length).fill("toughness");

  function pick(index: number) {
    lastAction.set({
      type: "pick",
      index
    });
    $ownTeam.equipment.push($equipment.splice(index, 1)[0]);
  }

  function pickSkill(index: number, skill: keyof FighterStats | number) {
    skills[index] = skill;
  }

  function practice(skills: (keyof FighterStats | number)[]) {
    lastAction.set({
      type: "practice",
      skills
    });
  }
</script>

<div>
  <h2>Equipment</h2>
  <div class="fighters">
    {#each $equipment as equipment, index}
      <EquipmentInfo {...equipment} {index} />
    {/each}
  </div>
</div>
<div>
  {#if $ownTeamIndex !== null}
    <h2>Your fighters</h2>
    {#each $ownTeam.fighters as fighter}
      {fighter.name}
    {/each}

    <h2>Your equipment</h2>
    {#each $ownTeam.equipment as equipment}
      {equipment.name}
    {/each}
  {/if}
</div>

<style>
  .fighters {
    flex: 1;
    align-items: stretch;
  }
</style>