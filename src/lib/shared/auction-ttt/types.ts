import type { BasicViewpointInfo } from '../common/types';

// ============================================================================
// ENUMS & BASIC TYPES
// ============================================================================

export enum Side {
	X = 'X',
	O = 'O',
	None = '[none]'
}

export enum TurnPart {
	Nominating = 'nominating',
	Bidding = 'bidding',
	None = 'none'
}

export type GameStage = 'pregame' | 'midgame' | 'postgame';

// ============================================================================
// GAME DATA STRUCTURES
// ============================================================================

export interface Player {
	money: number;
	controller?: number;
	timeUsed?: number;
}

export interface Settings {
	startingMoney: number;
	startingPlayer: Side;
	useTiebreaker: boolean;
}

export type Winner =
	| { winningSide: Side.None }
	| { winningSide: Side.X | Side.O; start: [number, number]; end: [number, number] };

// ============================================================================
// SERVER STATE (never sent to client)
// ============================================================================

export interface ServerGameState {
	stage: GameStage;
	players: Record<Side.X | Side.O, Player>;
	squares: Side[][];
	turnPart: TurnPart;
	whoseTurnToNominate?: Side;
	whoseTurnToBid?: Side;
	currentlyNominatedSquare?: [number, number];
	lastBid?: number;
	winner?: Winner;
	settings: Settings;
	timeOfLastMove?: number;
}

// ============================================================================
// CLIENT VIEWPOINT (what client receives)
// ============================================================================

export type ClientGameState = BasicViewpointInfo &
	(
		| {
				gameStage: 'pregame';
				settings: Settings;
				players: Record<Side.X | Side.O, Player>;
		  }
		| {
				gameStage: 'midgame';
				settings: Settings;
				players: Record<Side.X | Side.O, Player>;
				squares: Side[][];
				turnPart: TurnPart;
				whoseTurnToNominate: Side;
				whoseTurnToBid?: Side;
				lastBid?: number;
				currentlyNominatedSquare?: [number, number];
				timeOfLastMove?: number;
		  }
		| {
				gameStage: 'postgame';
				settings: Settings;
				players: Record<Side.X | Side.O, Player>;
				squares: Side[][];
				winner: Winner;
		  }
	);

// ============================================================================
// ACTIONS (client → server)
// ============================================================================

export type Action =
	| { type: 'changeRoomSettings'; roomName: string; isPublic: boolean }
	| { type: 'changeGameSettings'; settings: Settings }
	| { type: 'join'; side: Side.X | Side.O }
	| { type: 'leave' }
	| { type: 'start' }
	| { type: 'nominate'; square: [number, number]; startingBid: number }
	| { type: 'bid'; amount: number }
	| { type: 'pass' }
	| { type: 'rematch' }
	| { type: 'backToSettings' };

// ============================================================================
// EVENTS (server → client)
// ============================================================================

export type GameEvent =
	| { type: 'changeRoomSettings'; roomName: string; isPublic: boolean }
	| { type: 'changeHost'; host: number }
	| { type: 'changeGameSettings'; settings: Settings }
	| { type: 'join'; controller: number; side: Side }
	| { type: 'leave'; side: Side }
	| { type: 'start'; startingPlayer: Side }
	| { type: 'timing'; X: number; O: number; timeOfLastMove: number }
	| { type: 'nominate'; square: [number, number]; startingBid: number }
	| { type: 'bid'; amount: number }
	| { type: 'pass' }
	| { type: 'awardSquare'; side: Side }
	| ({ type: 'gameOver' } & Winner)
	| { type: 'backToSettings' };
