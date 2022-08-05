<script lang="ts">
  import type { Team } from "$lib/tourney/types";
  import FighterInfo from "$lib/tourney/fighter-info.svelte";
  import EquipmentInfo from "$lib/tourney/equipment-info.svelte";

  export let team: Team;
</script>

<div>
  <h2>Fighters</h2>
  <div class="fighters">
    {#each team.fighters as fighter, index}
      <FighterInfo {fighter} {index} />
    {/each}
  </div>
</div>
<div>
  <h2>Equipment</h2>
  <div class="fighters">
    {#each team.equipment as equipment, index}
      <EquipmentInfo {equipment} {index} />
    {/each}
  </div>
</div>