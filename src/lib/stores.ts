import { writable } from 'svelte/store';
import { GameType } from '$lib/types';

export const roomCode = writable("");
export const roomName = writable("");
export const isPublic = writable(false);
export const host = writable(-1);
export const pov = writable(-1);
export const gameType = writable(GameType.NoGameSelected);
export const connected = writable(false);

export const lastAction = writable(null);
export const eventLog = writable([]);