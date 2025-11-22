<script lang="ts">
  import type { Team } from "$lib/mayhem-manager/types";
  import FighterInfo from "$lib/mayhem-manager/fighter-info.svelte";
  import EquipmentInfo from "$lib/mayhem-manager/equipment-info.svelte";

  export let team: Team;
</script>

<div class="column" style:flex=1>
  <h2 class="column-title">Fighters</h2>
  <div class="fighters">
    {#each team.fighters as fighter}
      <FighterInfo {fighter} />
    {/each}
  </div>
</div>
<div class="column" style:flex=1>
  <h2 class="column-title">Equipment</h2>
  <div class="fighters">
    {#each team.equipment as equipment}
      <EquipmentInfo {equipment} />
    {/each}
  </div>
</div>