// Common types used across all games

export interface Viewer {
	id: string;
	index: number;
	siteUsername: string | null;
	isHost: boolean;
}

export interface BasicViewpointInfo {
	roomCode: string;
	roomName: string;
	isPublic: boolean;
	host: number;
	pov: number;
	connected: boolean;
}

export interface PublicRoomInfo {
	roomCode: string;
	roomName: string;
	isPublic: boolean;
	gameType: string;
	playerCount: number;
	maxPlayers: number;
	gameStage: string;
}

// WebSocket message types
export type ServerMessage<TGameState = any, TEvent = any> =
	| { type: 'gamestate'; data: TGameState }
	| { type: 'event'; event: TEvent }
	| { type: 'error'; message: string };

export type ClientMessage<TAction = any> =
	| { type: 'action'; action: TAction };

// Action result from game logic
export type ActionResult<TEvent = any> =
	| { success: true; events: TEvent[] }
	| { success: false; error: string };

// PRNG utilities
export interface RNG {
	randInt(min: number, max: number): number;
	randReal(): number;
	randElement<T>(arr: T[]): T;
}
