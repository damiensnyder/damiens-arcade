import { z } from "zod";
import { ActionAnimation, EquipmentSlot, StatName, Target, Trigger } from "./types";

export const joinSchema = z.object({
  type: z.literal("join"),
  name: z.string().trim().max(20)
});

export const leaveSchema = z.object({
  type: z.literal("leave")
});

export const replaceSchema = z.object({
  type: z.literal("replace"),
  team: z.number().min(0)
});

export const removeSchema = z.object({
  type: z.literal("remove"),
  team: z.number().min(0)
});

export const readySchema = z.object({
  type: z.literal("ready")
});

export const addBotSchema = z.object({
  type: z.literal("addBot")
});

export const advanceSchema = z.object({
  type: z.literal("advance")
});

export const pickSchema = z.object({
  type: z.literal("pick"),
  index: z.number().min(0)
});

export const passSchema = z.object({
  type: z.literal("pass")
});

export const practiceSchema = z.object({
  type: z.literal("practice"),
  equipment: z.array(z.number().min(0)),
  skills: z.array(z.any())
});

export const pickBRFighterSchema = z.object({
  type: z.literal("pickBRFighter"),
  fighter: z.number().int().min(0),
  equipment: z.array(z.number().int().min(0))
});

export const pickFightersSchema = z.object({
  type: z.literal("pickFighters"),
  equipment: z.array(z.array(z.number().int().min(0)))
});

export const resignSchema = z.object({
  type: z.literal("resign"),
  fighter: z.number().int().min(0)
});

export const repairSchema = z.object({
  type: z.literal("repair"),
  equipment: z.number().int().min(0)
});

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

export const effect = z.union([hpChangeEffect, damageEffect, statChangeEffect]);

export const actionAbility = z.object({
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

export const statChangeAbility = z.object({
  stat: z.nativeEnum(StatName),
  amount: z.number()
});

export const triggeredEffect = z.intersection(
  effect,
  z.object({
    trigger: z.nativeEnum(Trigger),
    target: z.nativeEnum(Target)
  })
);

export const aiHints = z.object({
  actionDanger: z.number().optional(),
  actionStat: z.nativeEnum(StatName).optional(),
  passiveDanger: z.number().optional(),
  passiveValue: z.number().optional(),
  teammateMultiplier: z.boolean().optional()
});

export const abilities = z.object({
  action: actionAbility.optional(),
  statChanges: z.array(statChangeAbility).optional(),
  triggeredEffects: z.array(triggeredEffect).optional(),
  aiHints: aiHints.optional()
});

export const fighterTemplateSchema = z.object({
  imgUrl: z.string().max(300),
  abilities: abilities,
  price: z.number().min(0).max(100).int(),
  description: z.string().max(300),
  flavor: z.string().max(300)
});

export const equipmentTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  imgUrl: z.string().max(300),
  slots: z.array(z.nativeEnum(EquipmentSlot)),
  abilities: z.array(abilities),
  price: z.number().min(0).max(100).int(),
  description: z.string().max(300),
  flavor: z.string().max(300)
});

export const settingsSchema = z.object({
  useDefaultFighters: z.boolean(),
  useDefaultEquipment: z.boolean(),
  customFighters: z.array(fighterTemplateSchema),
  customEquipment: z.array(equipmentTemplateSchema),
});

export const changeGameSettingsSchema = z.object({
  type: z.literal("changeGameSettings"),
  settings: settingsSchema
});

export const colorSchema = z.tuple([
  z.array(z.number()).length(3),
  z.array(z.number()).min(2).max(3)
]);

export const fighterSchema = z.object({
  name: z.string(),
  gender: z.union([z.literal("M"), z.literal("F"), z.literal("A")]),
  stats: z.object({
    strength: z.number().int().min(0).max(10),
    accuracy: z.number().int().min(0).max(10),
    energy: z.number().int().min(0).max(10),
    speed: z.number().int().min(0).max(10),
    toughness: z.number().int().min(0).max(10)
  }),
  attunements: z.array(z.string()),
  abilities: abilities,
  experience: z.number().int().min(0),
  price: z.number().int(),
  description: z.string(),
  flavor: z.string(),
  appearance: z.object({
    body: z.string(),
    hair: z.string(),
    face: z.string(),
    shirt: z.string(),
    shorts: z.string(),
    socks: z.string(),
    shoes: z.string(),
    hairColor: colorSchema,
    skinColor: colorSchema,
    shirtColor: colorSchema,
    shortsColor: colorSchema,
    shoesColor: colorSchema
  })
});

export const equipmentSchema = z.object({
  name: z.string(),
  imgUrl: z.string(),
  zoomedImgUrl: z.string(),
  slots: z.array(z.nativeEnum(EquipmentSlot)),
  abilities: abilities,
  yearsOwned: z.number().int().min(0),
  price: z.number().int(),
  description: z.string(),
  flavor: z.string()
});

export const teamSchema = z.object({
  name: z.string(),
  money: z.number().int().min(0),
  fighters: z.array(fighterSchema),
  equipment: z.array(equipmentSchema)
});

export const preseasonTeamSchema = z.intersection(
  teamSchema,
  z.object({
    needsResigning: z.array(fighterSchema),
    needsRepair: z.array(equipmentSchema)
  })
);

export const preseasonImportSchema = z.object({
  gameStage: z.literal("preseason"),
  teams: z.array(preseasonTeamSchema).max(16)
});
  
export const draftExportSchema = z.object({
  gameStage: z.literal("draft"),
  draftOrder: z.array(z.number().int().min(0).max(15)).max(16),
  spotInDraftOrder: z.number().int().min(0).max(15),
  fighters: z.array(fighterSchema).min(5),
  unsignedVeterans: z.array(fighterSchema)
});

export const faExportSchema = z.object({
  gameStage: z.literal("free agency"),
  draftOrder: z.array(z.number().int().min(0).max(15)).min(2).max(16),
  spotInDraftOrder: z.number().int().min(0).max(15),
  fighters: z.array(fighterSchema).min(5),
});

export const trainingExportSchema = z.object({
  gameStage: z.literal("training"),
  equipmentAvailable: z.array(z.array(equipmentSchema).length(8)).min(2).max(16)
});

export const brExportSchema = z.object({
  gameStage: z.literal("battle royale")
});

export const tournamentExportSchema = z.object({
  gameStage: z.literal("tournament"),
  bracketOrdering: z.array(z.number().min(0).max(15)).min(2).max(16)
});

export const importSchema = z.intersection(
  z.object({
    type: z.literal("import"),
    settings: settingsSchema,
    // history: z.array(z.array(z.string()).min(2).max(16)),
    teams: z.array(teamSchema)
  }),
  z.union([
    preseasonImportSchema, draftExportSchema, faExportSchema,
    trainingExportSchema, brExportSchema, tournamentExportSchema
  ])
);

export const exportLeagueSchema = z.object({
  type: z.literal("export")
});