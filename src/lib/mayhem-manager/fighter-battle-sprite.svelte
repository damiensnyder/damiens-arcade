<script lang="ts">
  import { EquipmentSlot, type FighterVisual, type EquipmentInBattle } from "$lib/mayhem-manager/types";
  import { Sprite } from "svelte-pixi";
  import * as PIXI from "pixi.js";
  import { onMount } from "svelte";

  export let fighter: FighterVisual;
  export let equipment: EquipmentInBattle[];
  export let charge: number;

  $: head = equipment.filter(e => e.slots.includes(EquipmentSlot.Head));
  $: torso = equipment.filter(e => e.slots.includes(EquipmentSlot.Torso));
  $: hands = equipment.filter(e => e.slots.includes(EquipmentSlot.Hand));
  $: legs = equipment.filter(e => e.slots.includes(EquipmentSlot.Legs));
  $: feet = equipment.filter(e => e.slots.includes(EquipmentSlot.Feet));

  const skinColorFilter = new PIXI.ColorMatrixFilter();
  const hairColorFilter = new PIXI.ColorMatrixFilter();
  const shirtColorFilter = new PIXI.ColorMatrixFilter();
  const shortsColorFilter = new PIXI.ColorMatrixFilter();
  const shoesColorFilter = new PIXI.ColorMatrixFilter();
  onMount(() => {
    skinColorFilter.matrix = [fighter.appearance.skinColor[0][0] / 255, 0, 0, 0, 0,
                              fighter.appearance.skinColor[0][1] / 255, 0, 0, 0, 0,
                              fighter.appearance.skinColor[0][2] / 255, 0, 0, 0, 0,
                              0, 0, 0, 1, 0];
    hairColorFilter.matrix = [fighter.appearance.hairColor[0][0] / 255, 0, 0, 0, 0,
                              fighter.appearance.hairColor[0][1] / 255, 0, 0, 0, 0,
                              fighter.appearance.hairColor[0][2] / 255, 0, 0, 0, 0,
                              0, 0, 0, 1, 0];
    shirtColorFilter.matrix = [fighter.appearance.shirtColor[0][0] / 255, 0, 0, 0, 0,
                               fighter.appearance.shirtColor[0][1] / 255, 0, 0, 0, 0,
                               fighter.appearance.shirtColor[0][2] / 255, 0, 0, 0, 0,
                               0, 0, 0, 1, 0];
    shortsColorFilter.matrix = [fighter.appearance.shortsColor[0][0] / 255, 0, 0, 0, 0,
                                fighter.appearance.shortsColor[0][1] / 255, 0, 0, 0, 0,
                                fighter.appearance.shortsColor[0][2] / 255, 0, 0, 0, 0,
                                0, 0, 0, 1, 0];
    shoesColorFilter.matrix = [fighter.appearance.shoesColor[0][0] / 255, 0, 0, 0, 0,
                               fighter.appearance.shoesColor[0][1] / 255, 0, 0, 0, 0,
                               fighter.appearance.shoesColor[0][2] / 255, 0, 0, 0, 0,
                               0, 0, 0, 1, 0];
  });
</script>

<Sprite texture={PIXI.Texture.from(fighter.appearance.body)}
    x={0} y={0} anchor={0.5} zIndex={0} filters={[skinColorFilter]} />
<Sprite texture={PIXI.Texture.from(fighter.appearance.hair)}
    x={0} y={0} anchor={0.5} zIndex={2} filters={[hairColorFilter]} />
<Sprite texture={PIXI.Texture.from(fighter.appearance.face)} anchor={0.5} zIndex={1}  />
{#if head.length === 1}
  <Sprite texture={PIXI.Texture.from(head[0].imgUrl)} x={0} y={0} anchor={0.5} zIndex={3} />
{/if}
{#if torso.length === 1}
  <Sprite texture={PIXI.Texture.from(torso[0].imgUrl)} x={0} y={0} anchor={0.5} zIndex={6} />
{:else}
  <Sprite texture={PIXI.Texture.from(fighter.appearance.shirt)}
      x={0} y={0} anchor={0.5} zIndex={6} filters={[shirtColorFilter]} />
{/if}
{#if hands.length >= 1}
  <Sprite texture={PIXI.Texture.from(hands[0].imgUrl)} x={0} y={0} anchor={0.5} zIndex={7} />
  {#if hands.length >= 2}
    <Sprite texture={PIXI.Texture.from(hands[1].imgUrl)} x={0} y={0} anchor={0.5} zIndex={8} scale={[-1, 1]} />
  {/if}
{/if}
{#if legs.length >= 1}
  <Sprite texture={PIXI.Texture.from(legs[0].imgUrl)} x={0} y={0} anchor={0.5} zIndex={4} />
{:else}
  <Sprite texture={PIXI.Texture.from(fighter.appearance.shorts)}
      x={0} y={0} anchor={0.5} zIndex={4} filters={[shortsColorFilter]} />
{/if}
{#if feet.length >= 1}
  <Sprite texture={PIXI.Texture.from(feet[0].imgUrl)} x={0} y={0} anchor={0.5} zIndex={5} />
{:else}
  <Sprite texture={PIXI.Texture.from(fighter.appearance.shoes)}
      x={0} y={0} anchor={0.5} zIndex={5} filters={[shoesColorFilter]} />
  <!-- <Sprite texture={PIXI.Texture.from(fighter.appearance.socks)} x={0} y={0} anchor={0.5} zIndex={4} /> -->
{/if}

{#if charge > 0}
  <Sprite texture={PIXI.Texture.from("/static/charge.png")} x={0} y={0} anchor={0.5} zIndex={8} alpha={charge} />
{/if}