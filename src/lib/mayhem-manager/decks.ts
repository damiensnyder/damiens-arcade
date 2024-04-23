import { z } from "zod";
import { readFileSync } from "fs";
import type { FighterNames, FighterTemplate, Settings, EquipmentTemplate } from "$lib/mayhem-manager/types";
import { changeGameSettingsSchema } from "./schemata";

const DECK_FILEPATH_BASE = "src/lib/mayhem-manager/data/";

export const fighterNames: FighterNames =
    JSON.parse(readFileSync(DECK_FILEPATH_BASE + "names.json").toString());
const defaultFighters: { fighters: FighterTemplate[] } =
    JSON.parse(readFileSync(DECK_FILEPATH_BASE + "fighters.json").toString());
const defaultEquipment: { equipment: EquipmentTemplate[] } =
    JSON.parse(readFileSync(DECK_FILEPATH_BASE + "equipment.json").toString());

export function settingsAreValid(settings: unknown): boolean {
  return changeGameSettingsSchema.safeParse(settings).success;
}

// Merge all the decks of settings into a single deck
export function collatedSettings(settings: Settings): {
  fighters: FighterTemplate[],
  equipment: EquipmentTemplate[],
} {
  return {
    fighters: settings.customFighters.concat(defaultFighters.fighters),
    equipment: settings.customEquipment.concat(defaultEquipment.equipment)
  }
}