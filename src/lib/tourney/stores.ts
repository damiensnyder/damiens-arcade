import { writable } from "svelte/store";
import type { TourneyGameStatus, Team, Settings } from "$lib/tourney/types";

export const teams = writable([] as Team[]);
export const gameStatus = writable("pregame" as TourneyGameStatus);
export const settings = writable({} as Settings);
export const rawSettings = writable("{}");