import { array, boolean, number, object, string } from "yup";
import { readFileSync, readdirSync } from "fs";
import { EquipmentSlot, type EquipmentDeck, type FighterDeck, type FighterInBattle, type Map, type MapDeck, type Settings, type Team, type TourneyEvent } from "$lib/tourney/types";
import type { Socket } from "socket.io";

const fighterStatsSchema = array(
  number().min(0).max(10).integer()
).length(6);

const ability = object();

const DECK_FILEPATH_BASE = "src/tourney/decks/"

const fighterDecks: Record<string, FighterDeck> = {};
readdirSync(DECK_FILEPATH_BASE + "fighters").forEach((fileName) => {
  fighterDecks[fileName.split(".")[0]] =
      JSON.parse(readFileSync(DECK_FILEPATH_BASE + "fighters/" + fileName).toString());
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
  slot: string().oneOf(Object.values(EquipmentSlot)).required(),
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
  customFighters: object({
    firstNames: array(string().min(0).max(100)).required(),
    lastNames: array(string().min(0).max(100)).required(),
    art: array(string().min(0).max(300)).required(),
    fighters: array(fighterTemplateSchema).required()
  }),
  customEquipment: object({
    equipment: array(equipmentTemplateSchema).required()
  }),
  customMaps: object({
    maps: array(mapSchema).required()
  })
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
    firstNames: [],
    lastNames: [],
    art: [],
    abilities: []
  }
  const equipmentDeck: EquipmentDeck = {
    equipment: []
  }
  const mapDeck: MapDeck = {
    maps: []
  }

  for (const deck of settings.fighterDecks.map(deckName => fighterDecks[deckName])
      .filter(deck => deck !== undefined)
      .concat(settings.customFighters)) {
    fighterDeck.firstNames = fighterDeck.firstNames.concat(deck.firstNames);
    fighterDeck.lastNames = fighterDeck.lastNames.concat(deck.lastNames);
    fighterDeck.art = fighterDeck.art.concat(deck.art);
    fighterDeck.abilities = fighterDeck.abilities.concat(deck.abilities);
  }
  for (const deck of settings.equipmentDecks.map(deckName => equipmentDecks[deckName])
      .filter(deck => deck !== undefined)
      .concat(settings.customEquipment)) {
    equipmentDeck.equipment = equipmentDeck.equipment.concat(deck.equipment);
  }
  for (const deck of settings.mapDecks.map(deckName => mapDecks[deckName])
      .filter(deck => deck !== undefined)
      .concat(settings.customMaps)) {
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
    equipment: null,
    maps: null
  }
}

export function isValidEquipmentBR(team: Team, equipment: number[]): boolean {
  const usedSlots: EquipmentSlot[] = [];
  for (const e of equipment) {
    if (e < 0 || e >= team.equipment.length) {
      return false;
    }
    if (usedSlots.includes(team.equipment[e].slot)) {
      return false;
    }
    usedSlots.push(team.equipment[e].slot);
  }
  return true;
}

export function isValidEquipmentTournament(team: Team, equipment: number[][]): boolean {
  if (equipment.length !== team.fighters.length) {
    return false;
  }
  const usedEquipment: number[] = [];
  for (const f of equipment) {
    const usedSlots: EquipmentSlot[] = [];
    for (const e of f) {
      if (e < 0 || e >= team.equipment.length) {
        return false;
      }
      if (usedSlots.includes(team.equipment[e].slot) || usedEquipment.includes(e)) {
        return false;
      }
      usedSlots.push(team.equipment[e].slot);
      usedEquipment.push(e);
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