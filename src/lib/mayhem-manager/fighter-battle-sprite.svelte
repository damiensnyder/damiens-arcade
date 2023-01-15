<script lang="ts">
  import { type Fighter, type Equipment, EquipmentSlot } from "$lib/mayhem-manager/types";
  import { Sprite } from "svelte-pixi";
  import * as PIXI from "pixi.js";

  export let fighter: Fighter;
  export let equipment: Equipment[];
  export let team: number = -1;

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

  const SKIN_COLORS = [[0.3, 1], [0.5, 0.8], [1, 0.6], [1.5, 0.5], [2, 0.3], [3, 0.4],
                      [5, 0.5], [7, 0.4], [8, 0.4], [10, 0.3]];
  $: skinColor = pseudorandomFrom(
    SKIN_COLORS, fighter.name.length, fighter.description.length, fighter.stats.energy
  );

  const SHIRT_COLORS = [[0, 0.7, 1], [0, 0, 1], [255, 0.2, 2], [120, 0.5, 1], [0, 10, 0], [240, 2, 0.5]];
  $: shirtColor = team === -1 ? pseudorandomFrom(
    SHIRT_COLORS, fighter.name.length, fighter.description.length, fighter.stats.reflexes
  ) : SHIRT_COLORS[team % SHIRT_COLORS.length];

  const SHORTS_COLORS = [[0, 0, 1], [240, 0.2, 2], [200, 0.5, 1], [0, 10, 1], [240, 2, 0.5]];
  $: shortsColor = team === -1 ? pseudorandomFrom(
    SHORTS_COLORS, fighter.name.length, fighter.description.length, fighter.stats.speed
  ) : SHORTS_COLORS[team % SHORTS_COLORS.length];

  const SHOES_COLORS = [[0, 10, 1], [0, 0, 1], [0, 0.5, 1], [240, 0.2, 0.5], [200, 0.5, 0.5]];
  $: shoesColor = pseudorandomFrom(
    SHOES_COLORS, fighter.name.length, fighter.description.length, fighter.stats.strength
  );

  const skinColorFilter = new PIXI.ColorMatrixFilter();
  skinColorFilter.hue(25, false);
  skinColorFilter.brightness(skinColor[0], false);
  skinColorFilter.saturate(skinColor[1], false);
  const hairColorFilter = new PIXI.ColorMatrixFilter();
  hairColorFilter.hue(25, false);
  hairColorFilter.brightness(hairColor[0], false);
  hairColorFilter.saturate(hairColor[1], false);
  const shirtColorFilter = new PIXI.ColorMatrixFilter();
  shirtColorFilter.hue(shirtColor[0], false);
  shirtColorFilter.brightness(shirtColor[1], false);
  shirtColorFilter.saturate(shirtColor[2], false);
  const shortsColorFilter = new PIXI.ColorMatrixFilter();
  shortsColorFilter.hue(shortsColor[0], false);
  shortsColorFilter.brightness(shortsColor[1], false);
  shortsColorFilter.saturate(shortsColor[2], false);
  const shoesColorFilter = new PIXI.ColorMatrixFilter();
  shoesColorFilter.hue(shoesColor[0], false);
  shoesColorFilter.brightness(shoesColor[1], false);
  shoesColorFilter.saturate(shoesColor[2], false);
</script>

<Sprite texture={PIXI.Texture.from(`/static/base/body_${fighter.gender}1.png`)}
    x={0} y={0} anchor={0.5} zIndex={0} filters={[skinColorFilter]} />
<Sprite texture={PIXI.Texture.from(`/static/base/hair_${fighter.gender}1.png`)}
    x={0} y={0} anchor={0.5} zIndex={2} filters={[hairColorFilter]} />
<Sprite texture={PIXI.Texture.from(`/static/base/face_1.png`)} anchor={0.5} zIndex={1}  />
{#if head.length === 1}
  <Sprite texture={PIXI.Texture.from(head[0].imgUrl)} x={0} y={0} anchor={0.5} zIndex={3} />
{/if}
{#if torso.length === 1}
  <Sprite texture={PIXI.Texture.from(torso[0].imgUrl)} x={0} y={0} anchor={0.5} zIndex={6} />
{:else}
  <Sprite texture={PIXI.Texture.from(`/static/base/torso_${fighter.gender}1.png`)}
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
  <Sprite texture={PIXI.Texture.from(`/static/base/legs_${fighter.gender}1.png`)}
      x={0} y={0} anchor={0.5} zIndex={4} filters={[shortsColorFilter]} />
{/if}
{#if feet.length >= 1}
  <Sprite texture={PIXI.Texture.from(feet[0].imgUrl)} x={0} y={0} anchor={0.5} zIndex={5} />
{:else}
  <Sprite texture={PIXI.Texture.from(`/static/base/feet_${fighter.gender}1.png`)}
      x={0} y={0} anchor={0.5} zIndex={5} filters={[shoesColorFilter]} />
{/if}