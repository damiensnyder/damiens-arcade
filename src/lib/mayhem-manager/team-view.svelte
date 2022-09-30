<script lang="ts">
  import type { Team } from "$lib/mayhem-manager/types";
  import FighterInfo from "$lib/mayhem-manager/fighter-info.svelte";
  import EquipmentInfo from "$lib/mayhem-manager/equipment-info.svelte";

  export let team: Team;
</script>

<div>
  <h2>Fighters</h2>
  <div class="fighters">
    {#each team.fighters as fighter}
      <FighterInfo {fighter} />
    {/each}
  </div>
</div>
<div>
  <h2>Equipment</h2>
  <div class="fighters">
    {#each team.equipment as equipment}
      <EquipmentInfo {equipment} />
    {/each}
  </div>
</div>