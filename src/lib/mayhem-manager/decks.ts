import { readFileSync } from "fs";
import { EquipmentSlot, type AbilityHaverInBattle, type Appearance, type Equipment, type EquipmentInBattle, type Fighter, type FighterInBattle, type FighterNames, type FighterStats } from "$lib/mayhem-manager/types";
import type { Fight } from "./battle-logic";

export const fighterNames: FighterNames =
    JSON.parse(readFileSync("src/lib/mayhem-manager/data/names.json").toString());



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
    name: string, appearance: Appearance, basePrice: number, stats: FighterStats): Fighter {
  const template = fighterAbilitiesCatalog[fighterKey];
  return {
    name,
    appearance,
    stats,
    description: template.description,
    flavor: template.flavor,
    experience: 0,
    price: basePrice === 0 ? 0 : basePrice + template.price,
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

export const equipmentCatalog: Record<string, EquipmentTemplate> = {
  battleAxe: {
    name: "Battle Axe",
    slots: [EquipmentSlot.Hand, EquipmentSlot.Hand],
    imgUrl: "/static/equipment/battle-axe.png",
    zoomedImgUrl: "/static/zoomed/equipment/battle-axe.png",
    price: 32,
    description: "Melee. Deals 70 damage. Cooldown 5s.",
    flavor: "learn this secret trick lumberjacks DON'T want you to know",
    abilities: {}
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