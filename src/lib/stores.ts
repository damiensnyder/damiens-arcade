import { writable } from 'svelte/store';
import { GameType } from '$lib/types';
import type { Action, GamestateMutator, Viewpoint } from '$lib/types';

function createGamestate() {
	const { subscribe, set, update } = writable({
		roomCode: "",
		roomName: "",
		isPublic: false,
		host: -1,
		pov: -1,
    gameType: GameType.NoGameSelected,
    connected: false,
  } as any);

	return {
		subscribe,
    update: (mutator: GamestateMutator) => update(mutator),
		set: (newGamestate: Viewpoint) => {
			if (newGamestate.gameType === GameType.AuctionTTT &&
					newGamestate.gameStatus === "midgame") {
				newGamestate.currentBid = (newGamestate.lastBid || -1) + 1;
			}
			set(newGamestate);
		}
	};
}

export const gamestate = createGamestate();

function createLastAction() {
	const { subscribe, set } = writable(null);

	return {
		subscribe,
		set: (newAction: Action) => set(newAction)
	};
}

export const lastAction = createLastAction();