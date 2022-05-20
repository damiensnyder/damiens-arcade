import { array, boolean, number, object, string } from "yup";
import { readFileSync } from "fs";
import type { Settings } from "$lib/tourney/types";

const fighterStatsSchema = array(
  number().min(0).max(10).integer()
).length(6);

const ability = object();

const fighterSchema = object({
  name: string().required().min(1).max(100),
  imgUrl: string().max(300),
  stats: fighterStatsSchema,
  abilities: array(ability),
  price: number().min(0).max(100).integer().required(),
  description: string().max(300),
  flavor: string().max(300)
});

const equipmentSchema = object({
  name: string().required().min(1).max(100),
  imgUrl: string().max(300),
  stats: fighterStatsSchema.required(),
  slot: number().min(0).max(5).required(),
  abilities: array(ability),
  price: number().min(0).max(100).integer(),
  description: string().max(300),
  flavor: string().max(300)
});

const battleMapSchema = object({
  name: string()
});

const changeGameSettingsSchema = object({
  type: string().required().equals(["changeGameSettings"]),
  settings: object({
    maps: array(battleMapSchema),
    fighters: array(fighterSchema),
    equipment: array(equipmentSchema),
    excludeDefaultMaps: boolean(),
    excludeDefaultFighters: boolean(),
    excludeDefaultEquipment: boolean()
  })
});

const defaultSettings: Settings = JSON.parse(
  readFileSync("src/lib/tourney/default-settings.json").toString()
);

export function settingsAreValid(settings: unknown): boolean {
  return changeGameSettingsSchema.isValidSync(settings);
}

export function addDefaultsIfApplicable(settings: any): void {
  if (!settings.maps) {
    settings.maps = []
  }
  if (!settings.excludeDefaultMaps || settings.maps.length === 0) {
    settings.maps.concat(defaultSettings.maps);
  }
  if (!settings.fighters) {
    settings.fighters = []
  }
  if (!settings.excludeDefaultFighters || settings.fighters.length === 0) {
    settings.fighters.concat(defaultSettings.fighters);
  }
  if (!settings.equipment) {
    settings.equipment = []
  }
  if (!settings.excludeDefaultEquipment || settings.equipment.length === 0) {
    settings.equipment.concat(defaultSettings.equipment);
  }
  delete settings.excludeDefaultMaps;
  delete settings.excludeDefaultFighters;
  delete settings.excludeDefaultEquipment;
}