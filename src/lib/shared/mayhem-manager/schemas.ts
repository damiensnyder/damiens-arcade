import { z } from 'zod';
import { EquipmentSlot, StatName } from './types';

export const JoinSchema = z.object({
	type: z.literal('join'),
	name: z.string().trim().max(20)
});

export const LeaveSchema = z.object({
	type: z.literal('leave')
});

export const ReplaceSchema = z.object({
	type: z.literal('replace'),
	team: z.number().min(0)
});

export const RemoveSchema = z.object({
	type: z.literal('remove'),
	team: z.number().min(0)
});

export const ReadySchema = z.object({
	type: z.literal('ready')
});

export const AddBotSchema = z.object({
	type: z.literal('addBot')
});

export const AdvanceSchema = z.object({
	type: z.literal('advance')
});

export const PickSchema = z.object({
	type: z.literal('pick'),
	index: z.number().min(0)
});

export const PassSchema = z.object({
	type: z.literal('pass')
});

export const PracticeSchema = z.object({
	type: z.literal('practice'),
	equipment: z.array(z.number().min(0)),
	skills: z.array(z.any())
});

export const PickBRFighterSchema = z.object({
	type: z.literal('pickBRFighter'),
	fighter: z.number().int().min(0),
	equipment: z.array(z.number().int().min(0))
});

export const PickFightersSchema = z.object({
	type: z.literal('pickFighters'),
	equipment: z.array(z.array(z.number().int().min(0)))
});

export const ResignSchema = z.object({
	type: z.literal('resign'),
	fighter: z.number().int().min(0)
});

export const RepairSchema = z.object({
	type: z.literal('repair'),
	equipment: z.number().int().min(0)
});

export const SettingsSchema = z.object({});

export const ChangeGameSettingsSchema = z.object({
	type: z.literal('changeGameSettings'),
	settings: SettingsSchema
});

export const ColorSchema = z.tuple([z.array(z.number()).length(3), z.array(z.number()).min(2).max(3)]);

export const FighterSchema = z.object({
	name: z.string(),
	gender: z.union([z.literal('M'), z.literal('F'), z.literal('A')]),
	stats: z.object({
		strength: z.number().int().min(0).max(10),
		accuracy: z.number().int().min(0).max(10),
		energy: z.number().int().min(0).max(10),
		speed: z.number().int().min(0).max(10),
		toughness: z.number().int().min(0).max(10)
	}),
	attunements: z.array(z.string()),
	abilityName: z.string(),
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
		hairColor: ColorSchema,
		skinColor: ColorSchema,
		shirtColor: ColorSchema,
		shortsColor: ColorSchema,
		shoesColor: ColorSchema
	})
});

export const EquipmentSchema = z.object({
	name: z.string(),
	imgUrl: z.string(),
	zoomedImgUrl: z.string(),
	slots: z.array(z.nativeEnum(EquipmentSlot)),
	abilityName: z.string(),
	yearsOwned: z.number().int().min(0),
	price: z.number().int(),
	description: z.string(),
	flavor: z.string()
});

export const TeamSchema = z.object({
	name: z.string(),
	money: z.number().int().min(0),
	fighters: z.array(FighterSchema),
	equipment: z.array(EquipmentSchema)
});

export const PreseasonTeamSchema = z.intersection(
	TeamSchema,
	z.object({
		needsResigning: z.array(FighterSchema),
		needsRepair: z.array(EquipmentSchema)
	})
);

export const PreseasonImportSchema = z.object({
	gameStage: z.literal('preseason'),
	teams: z.array(PreseasonTeamSchema).max(16)
});

export const DraftExportSchema = z.object({
	gameStage: z.literal('draft'),
	draftOrder: z.array(z.number().int().min(0).max(15)).max(16),
	spotInDraftOrder: z.number().int().min(0).max(15),
	fighters: z.array(FighterSchema).min(5),
	unsignedVeterans: z.array(FighterSchema)
});

export const FAExportSchema = z.object({
	gameStage: z.literal('free agency'),
	draftOrder: z.array(z.number().int().min(0).max(15)).min(2).max(16),
	spotInDraftOrder: z.number().int().min(0).max(15),
	fighters: z.array(FighterSchema).min(5)
});

export const TrainingExportSchema = z.object({
	gameStage: z.literal('training'),
	equipmentAvailable: z.array(z.array(EquipmentSchema).length(8)).min(2).max(16)
});

export const BRExportSchema = z.object({
	gameStage: z.literal('battle royale')
});

export const TournamentExportSchema = z.object({
	gameStage: z.literal('tournament'),
	bracketOrdering: z.array(z.number().min(0).max(15)).min(2).max(16)
});

export const ImportSchema = z.intersection(
	z.object({
		type: z.literal('import'),
		settings: SettingsSchema,
		// history: z.array(z.array(z.string()).min(2).max(16)),
		teams: z.array(TeamSchema)
	}),
	z.union([
		PreseasonImportSchema,
		DraftExportSchema,
		FAExportSchema,
		TrainingExportSchema,
		BRExportSchema,
		TournamentExportSchema
	])
);

export const ExportLeagueSchema = z.object({
	type: z.literal('export')
});

export const ActionSchema = z.union([
	JoinSchema,
	LeaveSchema,
	ReplaceSchema,
	RemoveSchema,
	ReadySchema,
	AddBotSchema,
	AdvanceSchema,
	PickSchema,
	PassSchema,
	PracticeSchema,
	PickBRFighterSchema,
	PickFightersSchema,
	ResignSchema,
	RepairSchema,
	ImportSchema,
	ExportLeagueSchema
]);
