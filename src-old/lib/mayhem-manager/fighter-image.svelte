<script lang="ts">
  import { type Equipment, EquipmentSlot } from "$lib/mayhem-manager/types";

  export let fighter: any;
  export let equipment: Equipment[];
  export let inBattle: boolean = false;
  $: imageSize = window.innerWidth > 720 ? window.innerWidth > 1200 ? "15rem" : "12rem" : "10rem";

  $: head = equipment.filter(e => e.slots.includes(EquipmentSlot.Head));
  $: torso = equipment.filter(e => e.slots.includes(EquipmentSlot.Torso));
  $: hands = equipment.filter(e => e.slots.includes(EquipmentSlot.Hand));
  $: legs = equipment.filter(e => e.slots.includes(EquipmentSlot.Legs));
  $: feet = equipment.filter(e => e.slots.includes(EquipmentSlot.Feet));
</script>

<!-- svelte-ignore a11y-missing-attribute -->
<div class="img-container"
    style:width={inBattle ? "100%" : imageSize}
    style:height={inBattle ? "100%" : imageSize}
    style:margin-top={inBattle ? "0" : "-2rem"}
    style:margin-left={inBattle ? "0" : "-1rem"}>
  <img src={fighter.appearance.body}
      style:filter={`hue-rotate(25deg) brightness(${fighter.appearance.skinColor[1][0]}) saturate(${fighter.appearance.skinColor[1][1]})`} />
  <img src={fighter.appearance.hair} class="body-part"
      style:filter={`hue-rotate(25deg) brightness(${fighter.appearance.hairColor[1][0]}) saturate(${fighter.appearance.hairColor[1][1]})`} />
  <img src={fighter.appearance.face} class="body-part" />
  {#if head.length === 1}
    <img src={head[0].imgUrl} class="equipment" />
  {/if}
  {#if torso.length === 1}
    <img src={torso[0].imgUrl} class="equipment" />
  {:else}
    <img src={fighter.appearance.shirt} class="equipment"
        style:filter={`hue-rotate(${fighter.appearance.shirtColor[1][0]}deg) brightness(${fighter.appearance.shirtColor[1][1]}) saturate(${fighter.appearance.shirtColor[1][2]})`} />
  {/if}
  {#if hands.length >= 1}
    <img src={hands[0].imgUrl} class="equipment hand" />
    {#if hands.length >= 2}
      <img src={hands[1].imgUrl} class="equipment hand flipped" />
    {/if}
  {/if}
  {#if legs.length >= 1}
    <img src={legs[0].imgUrl} class="equipment legs" />
  {:else}
    <img src={fighter.appearance.shorts} class="equipment legs"
        style:filter={`hue-rotate(${fighter.appearance.shortsColor[1][0]}deg) brightness(${fighter.appearance.shortsColor[1][1]}) saturate(${fighter.appearance.shortsColor[1][2]})`} />
  {/if}
  {#if feet.length >= 1}
    <img src={feet[0].imgUrl} class="equipment" />
  {:else}
    <!-- <img src={fighter.appearance.socks} class="body-part" /> -->
    <img src={fighter.appearance.shoes} class="equipment"
        style:filter={`hue-rotate(${fighter.appearance.shoesColor[1][0]}deg) brightness(${fighter.appearance.shoesColor[1][1]}) saturate(${fighter.appearance.shoesColor[1][2]})`} />
  {/if}
</div>

<style>
  .img-container {
    position: relative;
    z-index: 0;
  }

  img {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }

  .body-part {
    z-index: 1;
  }

  .equipment {
    z-index: 3;
  }

  .hand {
    z-index: 5;
  }

  .legs {
    z-index: 2;
  }
  
  .flipped {
    transform: scaleX(-1);
    z-index: 4;
  }
</style>