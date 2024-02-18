import { z } from "zod";
import { readFileSync } from "fs";
import { EquipmentSlot, type FighterNames, type FighterTemplate, type Settings, StatName, Target, Trigger, type EquipmentTemplate, ActionAnimation, type Abilities } from "$lib/mayhem-manager/types";



const hpChangeEffect = z.object({
    type: z.literal("hpChange"),
    amount: z.number().int()
  });
  
  const damageEffect = z.object({
    type: z.literal("damage"),
    amount: z.number()
  });
  
  const statChangeEffect = z.object({
    type: z.literal("statChange"),
    stat: z.nativeEnum(StatName),
    amount: z.number().int(),
    duration: z.number(),
    tint: z.array(z.number()).length(4).optional()
  });
  
  const effect = z.union([hpChangeEffect, damageEffect, statChangeEffect]);
  
  const actionAbility = z.object({
    target: z.nativeEnum(Target),
    effects: z.array(effect),
    cooldown: z.number().min(0),
    chargeNeeded: z.number().int().min(1).optional(),
    dodgeable: z.boolean().optional(),
    missable: z.boolean().optional(),
    animation: z.nativeEnum(ActionAnimation).optional(),
    projectileImg: z.string().optional(),
    knockback: z.number().optional()
  });
  
  const statChangeAbility = z.object({
    stat: z.nativeEnum(StatName),
    amount: z.number()
  });
  
  const triggeredEffect = z.intersection(
    effect,
    z.object({
      trigger: z.nativeEnum(Trigger),
      target: z.nativeEnum(Target)
    })
  );
  
  const aiHints = z.object({
    actionDanger: z.number().optional(),
    actionStat: z.nativeEnum(StatName).optional(),
    passiveDanger: z.number().optional(),
    passiveValue: z.number().optional(),
    teammateMultiplier: z.boolean().optional()
  });
  
  const abilities = z.object({
    action: actionAbility.optional(),
    statChanges: z.array(statChangeAbility).optional(),
    triggeredEffects: z.array(triggeredEffect).optional(),
    aiHints: aiHints.optional()
  });
  
  const DECK_FILEPATH_BASE = "src/lib/mayhem-manager/data/";
  
  export const fighterNames: FighterNames =
      JSON.parse(readFileSync(DECK_FILEPATH_BASE + "names.json").toString());
  const defaultFighters: { fighters: FighterTemplate[] } =
      JSON.parse(readFileSync(DECK_FILEPATH_BASE + "fighters.json").toString());
  const defaultEquipment: { equipment: EquipmentTemplate[] } =
      JSON.parse(readFileSync(DECK_FILEPATH_BASE + "equipment.json").toString());
  
  const fighterTemplateSchema = z.object({
    imgUrl: z.string().max(300),
    abilities: abilities,
    price: z.number().min(0).max(100).int(),
    description: z.string().max(300),
    flavor: z.string().max(300)
  });
  
  const equipmentTemplateSchema = z.object({
    name: z.string().min(1).max(100),
    imgUrl: z.string().max(300),
    slots: z.array(z.nativeEnum(EquipmentSlot)),
    abilities: z.array(abilities),
    price: z.number().min(0).max(100).int(),
    description: z.string().max(300),
    flavor: z.string().max(300)
  });
  
  const settingsSchema = z.object({
    useDefaultFighters: z.boolean(),
    useDefaultEquipment: z.boolean(),
    customFighters: z.array(fighterTemplateSchema),
    customEquipment: z.array(equipmentTemplateSchema),
  });
  
  const changeGameSettingsSchema = z.object({
    type: z.literal("changeGameSettings"),
    settings: settingsSchema
  });
  
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