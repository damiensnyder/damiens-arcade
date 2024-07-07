import { readFileSync } from "fs";
import { EquipmentSlot, type AbilityHaverInBattle, type Appearance, type Color, type Equipment, type EquipmentInBattle, type Fighter, type FighterInBattle, type FighterNames, type FighterStats } from "$lib/mayhem-manager/types";
import type { Fight } from "./battle-logic";
import type { RNG } from "$lib/types";

const fighterNames: FighterNames =
    JSON.parse(readFileSync("src/lib/mayhem-manager/data/names.json").toString());

const HAIR_COLORS: Color[] = [
  [[6, 6, 6], [0.1, 0]],
  [[7, 6, 5], [0.1, 0.1]],
  [[21, 10, 8], [0.2, 0.3]],
  [[47, 17, 15], [0.4, 0.4]],
  [[67, 20, 17], [0.5, 0.5]],
  [[90, 15, 10], [0.5, 0.8]],
  [[83, 38, 34], [0.8, 0.3]],
  [[167, 62, 46], [2, 0.5]],
  [[168, 99, 70], [4, 0.4]],
  [[139, 123, 114], [5, 0.1]]
];
const SKIN_COLORS: Color[] = [
  [[63, 7, 2], [0.3, 1]],
  [[90, 15, 10], [0.5, 0.8]],
  [[150, 37, 30], [1, 0.6]],
  [[163, 54, 43], [1.5, 0.5]],
  [[133, 70, 60], [2, 0.3]],
  [[159, 82, 61], [3, 0.4]],
  [[188, 113, 68], [5, 0.5]],
  [[194, 148, 97], [7, 0.4]],
  [[202, 164, 105], [8, 0.4]],
  [[214, 197, 141], [10, 0.3]]
];
const SHIRT_COLORS: Color[] = [
  [[176, 6, 15], [0, 0.7, 1]],
  [[0, 0, 0], [0, 0, 1]],
  [[12, 9, 89], [255, 0.2, 2]],
  [[3, 55, 4], [120, 0.5, 1]],
  [[54, 54, 54], [0, 10, 0]],
  [[5, 11, 30], [240, 2, 0.5]]
];
const SHORTS_COLORS: Color[] = [
  [[0, 0, 0], [0, 0, 1]],
  [[1, 14, 89], [240, 0.2, 2]],
  [[3, 47, 86], [200, 0.5, 1]],
  [[252, 13, 27], [0, 10, 1]],
  [[5, 11, 30], [240, 2, 0.5]]
];
const SHOES_COLORS: Color[] = [
  [[91, 31, 31], [0, 0.8, 0.3]],
  [[0, 0, 0], [0, 0, 1]],
  [[126, 3, 8], [0, 0.5, 1]],
  [[5, 11, 30], [240, 0.2, 0.5]],
  [[21, 43, 62], [200, 0.5, 0.5]]
];
const FIGHTER_INIT_STAT_DIST = [
  0, 0, 0, 0, 1, 1, 1, 1, 2, 2,
  2, 2, 2, 3, 3, 3, 3, 4, 4, 4,
  5, 5, 6, 7, 8
];


export interface EquipmentTemplate {
  name: string
  description: string
  flavor: string
  imgUrl: string
  zoomedImgUrl: string
  price: number
  slots: EquipmentSlot[]
  abilities: AbilityHaverInBattle
}

export interface FighterTemplate {
  description: string
  flavor: string
  price: number
  abilities: AbilityHaverInBattle
}

export function getEquipmentForPick(equipmentKey: string): Equipment {
  const template = equipmentCatalog[equipmentKey];
  return {
    name: template.name,
    slots: template.slots.slice(),
    imgUrl: template.imgUrl,
    zoomedImgUrl: template.zoomedImgUrl,
    price: template.price,
    description: template.description,
    flavor: template.flavor,
    yearsOwned: 0,
    abilityName: equipmentKey
  };
}

export function getEquipmentForBattle(equipmentKey: string, fighter: FighterInBattle): EquipmentInBattle {
  const template = equipmentCatalog[equipmentKey];
  return {
    name: template.name,
    slots: template.slots.slice(),
    imgUrl: template.imgUrl,
    fighter,
    ...template.abilities
  };
}

export function getFighterForPick(fighterKey: string,
    name: string, appearance: Appearance, stats: FighterStats): Fighter {
  const template = fighterAbilitiesCatalog[fighterKey];
  return {
    name,
    appearance,
    stats,
    description: template.description,
    flavor: template.flavor,
    experience: 0,
    price: template.price,
    attunements: [],
    abilityName: fighterKey
  };
}

export function getFighterForBattle(fighterKey: string, fighterOutOfBattle: Fighter,
    fight: Fight, equipmentNames: string[], x: number, y: number, team: number): FighterInBattle {
  const template = fighterAbilitiesCatalog[fighterKey];
  const ret: FighterInBattle = {
    name: fighterOutOfBattle.name,
    stats: fighterOutOfBattle.stats,
    appearance: fighterOutOfBattle.appearance,
    attunements: fighterOutOfBattle.attunements,
    equipment: [],
    hp: 100,
    cooldown: 0,
    charge: 0,
    x,
    y,
    statusEffects: [],
    team,
    fight,
    ...template.abilities
  };
  ret.equipment = equipmentNames.map(e => getEquipmentForBattle(e, ret));
  return ret;
}

export function generateSevenEquipment(rng: RNG): Equipment[] {
  const ret: Equipment[] = [];
  const equipmentList = Object.keys(equipmentCatalog);
  for (let i = 0; i < 7; i++) {
    let equipmentPicked = rng.randElement(equipmentList);
    while (equipmentList.length >= 7 && ret.map(e => e.name).includes(equipmentPicked)) {
      equipmentPicked = rng.randElement(equipmentList);
    }
    ret.push(getEquipmentForPick(equipmentPicked));
  }
  return ret;
}

export function generateFighters(amount: number, inFA: boolean, rng: RNG): Fighter[] {
  const ret: Fighter[] = [];
  const fighterAbilitiesList = Object.keys(fighterAbilitiesCatalog);
  for (let i = 0; i < amount; i++) {
    const gender = this.randElement(["M", "F", "A"]);
    const eligibleFirstNames = (gender === "M" || (gender === "A" && rng.randReal() < 0.5)) ? fighterNames.firstNamesM : fighterNames.firstNamesF;
    const appearance: Appearance = {
      body: `/static/base/body_${gender}1.png`,
      hair: `/static/base/hair_${gender}${this.randInt(1, 4)}.png`,
      face: `/static/base/face_${this.randInt(1, 2)}.png`,
      shirt: `/static/base/shirt_${gender}${this.randInt(1, 2)}.png`,
      shorts: `/static/base/shorts_${gender}1.png`,
      socks: `/static/base/socks_${gender}1.png`,
      shoes: `/static/base/shoes_${gender}1.png`,
      hairColor: rng.randElement(HAIR_COLORS),
      skinColor: rng.randElement(SKIN_COLORS),
      shirtColor: rng.randElement(SHIRT_COLORS),
      shortsColor: rng.randElement(SHORTS_COLORS),
      shoesColor: rng.randElement(SHOES_COLORS)
    };
    const stats: FighterStats = {
      strength: rng.randElement(FIGHTER_INIT_STAT_DIST),
      accuracy: rng.randElement(FIGHTER_INIT_STAT_DIST),
      energy: rng.randElement(FIGHTER_INIT_STAT_DIST),
      speed: rng.randElement(FIGHTER_INIT_STAT_DIST),
      toughness: rng.randElement(FIGHTER_INIT_STAT_DIST)
    };
    ret.push(
      getFighterForPick(
        rng.randReal() < 0.4 ? "noAbilities" : rng.randElement(fighterAbilitiesList),
        rng.randElement(eligibleFirstNames) + " " + rng.randElement(fighterNames.lastNames),
        appearance,
        stats
      )
    )
  }
  return ret;
}

export const equipmentCatalog: Record<string, EquipmentTemplate> = {
  battleAxe: {
    name: "Battle Axe",
    slots: [EquipmentSlot.Hand, EquipmentSlot.Hand],
    imgUrl: "/static/equipment/battle-axe.png",
    zoomedImgUrl: "/static/zoomed/equipment/battle-axe.png",
    price: 32,
    description: "Melee. Deals 70 damage. Cooldown 5s.",
    flavor: "learn this secret trick lumberjacks DON'T want you to know",
    abilities: {
      getActionPriority: (f) => {
        const dps = 14 * (0.5 + 0.1 * f.stats.strength);
        let maxValue = 0;
        for (let f2 of f.fight.enemies(f)) {
          maxValue = Math.max(valueOfMeleeAttack(f, f2, dps));
        }
        return maxValue;
      }
    }
  }
};

export const fighterAbilitiesCatalog: Record<string, FighterTemplate> = {
  noAbilities: {
    description: "",
    flavor: "",
    price: 0,
    abilities: {}
  }
}

function valueOfMeleeAttack(f1: FighterInBattle, f2: FighterInBattle, dps: number): number {
  const distance = Math.sqrt((f1.x - f2.x) ** 2 + (f1.y - f2.y) ** 2);
  const timeToReach = Math.max(
    f1.cooldown,
    distance / (3 + 0.6 * f1.stats.speed)
  );
  const survivability = f2.hp * (0.75 + 0.05 * f2.stats.toughness); 
  return fighterDanger(f2) / (timeToReach + (survivability / dps));
}

function fighterDanger(f: FighterInBattle): number {
  return 1;
}