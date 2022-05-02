import { writable } from "svelte/store";
import type { TourneyGameStage, Team, Settings } from "$lib/tourney/types";

export const teams = writable([] as Team[]);
export const gameStage = writable("pregame" as TourneyGameStage);
export const settings = writable({} as Settings);
export const rawSettings = writable("{}");