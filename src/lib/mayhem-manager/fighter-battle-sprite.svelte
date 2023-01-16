<script lang="ts">
  import { type Equipment, EquipmentSlot, type FighterInBattle } from "$lib/mayhem-manager/types";
  import { Sprite } from "svelte-pixi";
  import * as PIXI from "pixi.js";
  import { onMount } from "svelte";

  export let fighter: FighterInBattle;
  export let equipment: Equipment[];

  $: head = equipment.filter(e => e.slots.includes(EquipmentSlot.Head));
  $: torso = equipment.filter(e => e.slots.includes(EquipmentSlot.Torso));
  $: hands = equipment.filter(e => e.slots.includes(EquipmentSlot.Hand));
  $: legs = equipment.filter(e => e.slots.includes(EquipmentSlot.Legs));
  $: feet = equipment.filter(e => e.slots.includes(EquipmentSlot.Feet));

  function pseudorandomFrom<T>(arr: T[], seed1: number, seed2: number, seed3: number): T {
    seed1 = Math.abs(seed1);
    seed2 = Math.abs(seed2);
    seed3 = Math.abs(seed3);
    return arr[
      (seed1 + seed2 + seed3 + seed1 * seed2 + seed1 * seed3 + seed2 * seed3)
      % arr.length
    ];
  }

  const HAIR_COLORS = [[6, 6, 6], [7, 6, 5], [21, 10, 8], [47, 17, 15], [67, 20, 17], [90, 15, 10],
                       [83, 38, 34], [167, 62, 46], [168, 99, 70], [139, 123, 114]];
  $: hairColor = pseudorandomFrom(
    HAIR_COLORS, fighter.name.length, fighter.description.length, fighter.name.indexOf("e")
  );

  const SKIN_COLORS = [[63, 7, 2], [90, 15, 10], [150, 37, 30], [163, 54, 43], [133, 70, 60], [159, 82, 61],
                      [188, 113, 68], [194, 148, 97], [202, 164, 105], [214, 197, 141]];
  $: skinColor = pseudorandomFrom(
    SKIN_COLORS, fighter.name.length, fighter.name.indexOf("a"), fighter.description.length
  );

  const SHIRT_COLORS = [[176, 6, 15], [0, 0, 0], [12, 9, 89], [3, 55, 4], [54, 54, 54], [5, 11, 30]];
  $: shirtColor = SHIRT_COLORS[fighter.team % SHIRT_COLORS.length];

  const SHORTS_COLORS = [[0, 0, 0], [1, 14, 89], [3, 47, 86], [252, 13, 27], [5, 11, 30]];
  $: shortsColor = SHORTS_COLORS[fighter.team % SHORTS_COLORS.length];

  const SHOES_COLORS = [[91, 31, 31], [0, 0, 0], [126, 3, 8], [5, 11, 30], [21, 43, 62]];
  $: shoesColor = pseudorandomFrom(
    SHOES_COLORS, fighter.name.length, fighter.name.indexOf("t"), fighter.name.indexOf("o")
  );

  const skinColorFilter = new PIXI.ColorMatrixFilter();
  const hairColorFilter = new PIXI.ColorMatrixFilter();
  const shirtColorFilter = new PIXI.ColorMatrixFilter();
  const shortsColorFilter = new PIXI.ColorMatrixFilter();
  const shoesColorFilter = new PIXI.ColorMatrixFilter();
  onMount(() => {
    skinColorFilter.matrix = [skinColor[0] / 255, 0, 0, 0, 0,
                              skinColor[1] / 255, 0, 0, 0, 0,
                              skinColor[2] / 255, 0, 0, 0, 0,
                              0, 0, 0, 1, 0];
    hairColorFilter.matrix = [hairColor[0] / 255, 0, 0, 0, 0,
                              hairColor[1] / 255, 0, 0, 0, 0,
                              hairColor[2] / 255, 0, 0, 0, 0,
                              0, 0, 0, 1, 0];
    shirtColorFilter.matrix = [shirtColor[0] / 255, 0, 0, 0, 0,
                               shirtColor[1] / 255, 0, 0, 0, 0,
                               shirtColor[2] / 255, 0, 0, 0, 0,
                               0, 0, 0, 1, 0];
    shortsColorFilter.matrix = [shortsColor[0] / 255, 0, 0, 0, 0,
                                shortsColor[1] / 255, 0, 0, 0, 0,
                                shortsColor[2] / 255, 0, 0, 0, 0,
                                0, 0, 0, 1, 0];
    shoesColorFilter.matrix = [shoesColor[0] / 255, 0, 0, 0, 0,
                               shoesColor[1] / 255, 0, 0, 0, 0,
                               shoesColor[2] / 255, 0, 0, 0, 0,
                               0, 0, 0, 1, 0];
  });
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