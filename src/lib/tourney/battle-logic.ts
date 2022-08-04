import { array, boolean, number, object, string } from "yup";
import { readFileSync, readdirSync } from "fs";
import { EquipmentSlot, type Equipment, type EquipmentDeck, type FighterDeck, type FighterInBattle, type FighterNames, type FighterTemplate, type Map, type MapDeck, type Settings, type Team, type TourneyEvent } from "$lib/tourney/types";
import type { Socket } from "socket.io";

const fighterStatsSchema = array(
  number().min(0).max(10).integer()
).length(6);

const ability = object();

const DECK_FILEPATH_BASE = "src/lib/tourney/data/"

const fighterNames: FighterNames =
    JSON.parse(readFileSync(DECK_FILEPATH_BASE + "fighters/names.json").toString());
const fighterDecks: Record<string, FighterDeck> = {};
readdirSync(DECK_FILEPATH_BASE + "fighters").forEach((fileName) => {
  fighterDecks[fileName.split(".")[0]] =
      JSON.parse(readFileSync(DECK_FILEPATH_BASE + "fighters/" + fileName).toString()).abilities;
});
const equipmentDecks: Record<string, EquipmentDeck> = {};
readdirSync(DECK_FILEPATH_BASE + "equipment").forEach((fileName) => {
  equipmentDecks[fileName.split(".")[0]] =
      JSON.parse(readFileSync(DECK_FILEPATH_BASE + "equipment/" + fileName).toString());
});
const mapDecks: Record<string, MapDeck> = {};
readdirSync(DECK_FILEPATH_BASE + "maps").forEach((fileName) => {
  mapDecks[fileName.split(".")[0]] =
      JSON.parse(readFileSync(DECK_FILEPATH_BASE + "maps/" + fileName).toString());
});

const fighterTemplateSchema = object({
  imgUrl: string().max(300),
  abilities: array(ability).required(),
  price: number().min(0).max(100).integer().required(),
  description: string().max(300),
  flavor: string().max(300)
});

const equipmentTemplateSchema = object({
  name: string().required().min(1).max(100),
  imgUrl: string().max(300).required(),
  slots: array(string().oneOf(Object.values(EquipmentSlot))).required(),
  abilities: array(ability).required(),
  price: number().min(0).max(100).integer().required(),
  description: string().max(300),
  flavor: string().max(300)
});

const mapFeatureSchema = object();

const mapSchema = object({
  name: string().required().min(1).max(100),
  imgUrl: string().required().min(1).max(300),
  features: array(mapFeatureSchema).required()
});

const settingsSchema = object({
  fighterDecks: array(string().min(0).max(100)).required(),
  equipmentDecks: array(string().min(0).max(100)).required(),
  mapDecks: array(string().min(0).max(100)).required(),
  customFighters: array(fighterTemplateSchema).required(),
  customEquipment: array(equipmentTemplateSchema).required(),
  customMaps: array(mapSchema).required()
});

const changeGameSettingsSchema = object({
  type: string().required().equals(["changeGameSettings"]),
  settings: settingsSchema.required()
});

export function settingsAreValid(settings: unknown): boolean {
  return changeGameSettingsSchema.isValidSync(settings);
}

// Merge all the decks of settings into a single deck
export function collatedSettings(settings: Settings): {
  fighters: FighterDeck,
  equipment: EquipmentDeck,
  maps: MapDeck
} {
  // create empty decks
  const fighterDeck: FighterDeck = {
    abilities: settings.customFighters,
    ...fighterNames
  }
  const equipmentDeck: EquipmentDeck = {
    equipment: settings.customEquipment
  }
  const mapDeck: MapDeck = {
    maps: settings.customMaps
  }

  for (const deck of settings.fighterDecks.map(deckName => fighterDecks[deckName])
      .filter(deck => deck !== undefined)) {
    fighterDeck.abilities = fighterDeck.abilities.concat(deck.abilities);
  }
  for (const deck of settings.equipmentDecks.map(deckName => equipmentDecks[deckName])
      .filter(deck => deck !== undefined)) {
    equipmentDeck.equipment = equipmentDeck.equipment.concat(deck.equipment);
  }
  for (const deck of settings.mapDecks.map(deckName => mapDecks[deckName])
      .filter(deck => deck !== undefined)) {
    mapDeck.maps = mapDeck.maps.concat(deck.maps);
  }

  // Add defaults to empty decks
  for (const key in fighterDeck) {
    if (fighterDeck[key].length === 0) {
      fighterDeck[key] = fighterDecks["default"][key];
    }
  }
  if (equipmentDeck.equipment.length === 0) {
    equipmentDeck.equipment = equipmentDecks["default"].equipment;
  }
  if (mapDeck.maps.length === 0) {
    mapDeck.maps = mapDecks["default"].maps;
  }

  return {
    fighters: fighterDeck,
    equipment: equipmentDeck,
    maps: mapDeck
  }
}

export function isValidEquipmentBR(team: Team, equipment: number[]): boolean {
  const usedEquipmentIds: number[] = [];
  let usedSlots: EquipmentSlot[] = [];
  for (const e of equipment) {
    if (e < 0 || e >= team.equipment.length || usedEquipmentIds.includes(e)) {
      return false;
    }
    usedSlots = usedSlots.concat(team.equipment[e].slots);
    usedEquipmentIds.push(e);
  }
  return usedSlots.filter(s => s === EquipmentSlot.Head).length <= 1 &&
      usedSlots.filter(s => s === EquipmentSlot.Torso).length <= 1 &&
      usedSlots.filter(s => s === EquipmentSlot.Hand).length <= 2 &&
      usedSlots.filter(s => s === EquipmentSlot.Legs).length <= 1 &&
      usedSlots.filter(s => s === EquipmentSlot.Feet).length <= 1;
}

export function isValidEquipmentTournament(team: Team, equipment: number[][]): boolean {
  if (equipment.length !== team.fighters.length) {
    return false;
  }
  const usedEquipment: number[] = [];
  for (const f of equipment) {
    let usedSlots: EquipmentSlot[] = [];
    for (const e of f) {
      if (e < 0 || e >= team.equipment.length) {
        return false;
      }
      if (usedEquipment.includes(e)) {
        return false;
      }
      usedEquipment.push(e);
      usedSlots = usedSlots.concat(team.equipment[e].slots);
    }
    if (usedSlots.filter(s => s === EquipmentSlot.Head).length > 1 ||
        usedSlots.filter(s => s === EquipmentSlot.Torso).length > 1 ||
        usedSlots.filter(s => s === EquipmentSlot.Hand).length > 2 ||
        usedSlots.filter(s => s === EquipmentSlot.Legs).length > 1 ||
        usedSlots.filter(s => s === EquipmentSlot.Feet).length > 1) {
      return false;
    }
  }
  return true;
}

// return true if right wins, false if left wins
export function simulateFight(
  eventEmitter: (event: TourneyEvent) => void, map: Map, fighters: FighterInBattle[]
): boolean {
  return false;
}