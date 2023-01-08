<script lang="ts">
  import type { FighterInBattle } from "$lib/mayhem-manager/types";
  import FighterImage from "$lib/mayhem-manager/fighter-image.svelte";
  import FighterInfo from "$lib/mayhem-manager/fighter-info.svelte";
  import { teams } from "$lib/mayhem-manager/stores";

  export let fighter: FighterInBattle;
</script>

<div class="horiz outer-container">
  <div class="image-container">
    <FighterImage {fighter} equipment={fighter.equipment} inBattle={true} team={fighter.team} />
  </div>
  <div class="info">
    <div class="info name horiz">
      <div class="show-child-on-hover">
        <!-- we check for null because, if we watch a fight from a different
          league for debug purposes, the number of teams might be different -->
        {fighter.name} &bull; {$teams[fighter.team] == null ? fighter.team : $teams[fighter.team].name}
        <div class="show-on-hover">
          <FighterInfo {fighter} />
        </div>
      </div>
    </div>
    <div class="info">
      {#if fighter.hp > 0}
        HP: {fighter.hp} / {fighter.maxHP}
      {:else}
        downed
      {/if}
    </div>
  </div>
</div>

<style>
  .outer-container {
    flex: 1;
    align-self: stretch;
    margin-top: 0.5rem;
    background-color: var(--bg-4);
    border: 2px solid var(--bg-1);
    border-radius: 0.75rem;
  }

  .info {
    align-items: flex-start;
  }

  .name {
    font-weight: 500;
  }

  .image-container {
    width: 5rem;
    height: 5rem;
    flex-shrink: 0;
  }
</style>