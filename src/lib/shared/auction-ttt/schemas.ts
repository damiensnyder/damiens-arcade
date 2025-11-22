import { z } from 'zod';
import { Side } from './types';

export const ChangeRoomSettingsSchema = z.object({
	type: z.literal('changeRoomSettings'),
	roomName: z
		.string()
		.trim()
		.min(1, 'Room name must be at least one character long.')
		.max(50, 'Room name cannot be longer than 50 characters.'),
	isPublic: z.boolean()
});

export const ChangeGameSettingsSchema = z.object({
	type: z.literal('changeGameSettings'),
	settings: z.object({
		startingMoney: z.number().int().min(0),
		startingPlayer: z.nativeEnum(Side),
		useTiebreaker: z.boolean()
	})
});

export const JoinSchema = z.object({
	type: z.literal('join'),
	side: z.union([z.literal(Side.X), z.literal(Side.O)])
});

export const LeaveSchema = z.object({
	type: z.literal('leave')
});

export const StartGameSchema = z.object({
	type: z.literal('start')
});

export const NominateSchema = z.object({
	type: z.literal('nominate'),
	square: z.array(z.number().min(0).max(2)).length(2),
	startingBid: z.number().min(0)
});

export const BidSchema = z.object({
	type: z.literal('bid'),
	amount: z.number().min(0)
});

export const PassSchema = z.object({
	type: z.literal('pass')
});

export const RematchSchema = z.object({
	type: z.literal('rematch')
});

export const BackToSettingsSchema = z.object({
	type: z.literal('backToSettings')
});

export const ActionSchema = z.discriminatedUnion('type', [
	ChangeRoomSettingsSchema,
	ChangeGameSettingsSchema,
	JoinSchema,
	LeaveSchema,
	StartGameSchema,
	NominateSchema,
	BidSchema,
	PassSchema,
	RematchSchema,
	BackToSettingsSchema
]);
