<script lang="ts">
  import { type Fighter, type Equipment, EquipmentSlot } from "$lib/tourney/types";

  export let fighter: Fighter;
  export let equipment: Equipment[];

  $: head = equipment.filter(e => e.slots.includes(EquipmentSlot.Head));
  $: torso = equipment.filter(e => e.slots.includes(EquipmentSlot.Torso));
  $: hands = equipment.filter(e => e.slots.includes(EquipmentSlot.Hand));
  $: legs = equipment.filter(e => e.slots.includes(EquipmentSlot.Legs));
  $: feet = equipment.filter(e => e.slots.includes(EquipmentSlot.Feet));
</script>

<!-- svelte-ignore a11y-missing-attribute -->
<div class="img-container">
  <img src={`/static/fighters/body_${fighter.gender}1.png`} />
  <img src={`/static/fighters/hair_${fighter.gender}1.png`} class="body-part" />
  <img src={`/static/fighters/face_1.png`} class="body-part" />
  {#if head.length === 1}
    <img src={head[0].imgUrl} class="equipment" />
  {/if}
  {#if torso.length === 1}
    <img src={torso[0].imgUrl} class="equipment" />
  {:else}
    <img src={`/static/fighters/torso_${fighter.gender}1.png`} class="equipment" />
  {/if}
</div>

<style>
  .img-container {
    position: relative;
    z-index: 0;
  }

  .body-part,
  .equipment {
    position: absolute;
    z-index: 1;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
  }

  .equipment {
    z-index: 2;
  }
</style>