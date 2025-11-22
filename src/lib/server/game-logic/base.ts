import type { Viewer, ActionResult } from '../../shared/common/types';
import { PRNG } from '../utils/prng';

export abstract class GameLogicBase<TState, TAction, TEvent, TViewpoint> {
	protected state: TState;
	protected rng: PRNG;
	protected roomCode: string;
	protected roomName: string;
	protected isPublic: boolean;
	protected abstract gameStage: string;

	constructor(roomCode: string, seed: number) {
		this.roomCode = roomCode;
		this.roomName = 'Untitled Room';
		this.isPublic = false;
		this.rng = new PRNG(seed);
		this.state = this.initialState();
	}

	// Must be implemented by subclasses
	abstract initialState(): TState;
	abstract viewpointOf(viewer: Viewer): TViewpoint;
	abstract handleAction(viewer: Viewer, action: TAction): ActionResult<TEvent>;
	abstract handleDisconnect(viewer: Viewer): void;

	// Optional hook for when a viewer connects
	handleConnect(_viewer: Viewer): void {
		// Override if needed
	}

	// Helper methods for random number generation
	protected randInt(min: number, max: number): number {
		return this.rng.randInt(min, max);
	}

	protected randReal(): number {
		return this.rng.randReal();
	}

	protected randElement<T>(arr: T[]): T {
		return this.rng.randElement(arr);
	}

	// Room settings management
	changeRoomSettings(roomName: string, isPublic: boolean): void {
		this.roomName = roomName.trim() || 'Untitled Room';
		this.isPublic = isPublic;
	}

	getRoomInfo() {
		return {
			roomCode: this.roomCode,
			roomName: this.roomName,
			isPublic: this.isPublic,
			gameStage: this.gameStage
		};
	}
}
