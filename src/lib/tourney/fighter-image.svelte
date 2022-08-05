<script lang="ts">
  import { type Fighter, type Equipment, EquipmentSlot } from "$lib/tourney/types";

  export let fighter: Fighter;
  export let equipment: Equipment[];

  $: head = equipment.filter(e => e.slots.includes(EquipmentSlot.Head));
  $: torso = equipment.filter(e => e.slots.includes(EquipmentSlot.Torso));
  $: hands = equipment.filter(e => e.slots.includes(EquipmentSlot.Hand));
  $: legs = equipment.filter(e => e.slots.includes(EquipmentSlot.Legs));
  $: feet = equipment.filter(e => e.slots.includes(EquipmentSlot.Feet));

  function pseudorandomFrom<T>(arr: T[], seed1: number, seed2: number, seed3: number): T {
    return arr[
      (seed1 + seed2 + seed3 + seed1 * seed2 + seed1 * seed3 + seed2 * seed3)
      % arr.length
    ];
  }

  const HAIR_COLORS = [[0.1, 0], [0.1, 0.1], [0.2, 0.3], [0.4, 0.4], [0.5, 0.5], [0.5, 0.8],
                       [0.8, 0.3], [2, 0.5], [4, 0.4], [5, 0.1]];
  $: hairColor = pseudorandomFrom(
    HAIR_COLORS, fighter.name.length, fighter.description.length, fighter.stats.accuracy
  );

  const SKIN_COLORS = [[0.3, 1], [0.5, 0.8], [1, 0.6], [1.5, 0.5], [2, 0.5], [3, 0.5], [3, 0.4],
                      [5, 0.5], [7, 0.4], [8, 0.4], [10, 0.3]];
  $: skinColor = pseudorandomFrom(
    SKIN_COLORS, fighter.name.length, fighter.description.length, fighter.stats.energy
  );

  const SHIRT_COLORS = [[0, 0.7, 1], [0, 0, 1], [255, 0.2, 2], [120, 0.5, 1], [0, 10, 0], [240, 2, 0.5]];
  $: shirtColor = pseudorandomFrom(
    SHIRT_COLORS, fighter.name.length, fighter.description.length, fighter.stats.reflexes
  );

  const PANTS_COLORS = [[0, 0, 1], [240, 0.2, 2], [200, 0.5, 1], [0, 10, 1], [240, 2, 0.5]];
  $: pantsColor = pseudorandomFrom(
    PANTS_COLORS, fighter.name.length, fighter.description.length, fighter.stats.speed
  );

  const FEET_COLORS = [[0, 10, 1], [0, 0, 1], [0, 0.5, 1], [240, 0.2, 0.5], [200, 0.5, 0.5]];
  $: feetColor = pseudorandomFrom(
    FEET_COLORS, fighter.name.length, fighter.description.length, fighter.stats.strength
  );
</script>

<!-- svelte-ignore a11y-missing-attribute -->
<div class="img-container">
  <img src={`/static/base/body_${fighter.gender}1.png`}
      style:filter={`hue-rotate(25deg) brightness(${skinColor[0]}) saturate(${skinColor[1]})`} />
  <img src={`/static/base/hair_${fighter.gender}1.png`} class="body-part"
      style:filter={`hue-rotate(25deg) brightness(${hairColor[0]}) saturate(${hairColor[1]})`} />
  <img src={`/static/base/face_1.png`} class="body-part" />
  {#if head.length === 1}
    <img src={head[0].imgUrl} class="equipment" />
  {/if}
  {#if torso.length === 1}
    <img src={torso[0].imgUrl} class="equipment" />
  {:else}
    <img src={`/static/base/torso_${fighter.gender}1.png`} class="equipment"
        style:filter={`hue-rotate(${shirtColor[0]}deg) brightness(${shirtColor[1]}) saturate(${shirtColor[2]})`} />
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
    <img src={`/static/base/legs_${fighter.gender}1.png`} class="equipment legs"
        style:filter={`hue-rotate(${pantsColor[0]}deg) brightness(${pantsColor[1]}) grayscale(${pantsColor[2]})`} />
  {/if}
  {#if feet.length >= 1}
    <img src={feet[0].imgUrl} class="equipment" />
  {:else}
    <img src={`/static/base/feet_${fighter.gender}1.png`} class="equipment"
        style:filter={`hue-rotate(${feetColor[0]}deg) brightness(${feetColor[1]}) grayscale(${feetColor[2]})`} />
  {/if}
</div>

<style>
  .img-container {
    position: relative;
    z-index: 0;
    margin-top: -2rem;
    margin-left: -1rem;
  }

  .img-container,
  img {
    width: 15rem;
    height: 15rem;
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

  .hand {
    z-index: 4;
  }

  .legs {
    z-index: 3;
  }
  
  .flipped {
    transform: scaleX(-1);
    z-index: 5;
  }
</style>