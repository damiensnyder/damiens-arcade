import { derived, writable } from "svelte/store";
import type { TourneyGameStage, Team, Settings } from "$lib/tourney/types";
import { pov } from "$lib/stores";
import { getIndexByController, getTeamByController } from "$lib/tourney/utils";

export const gameStage = writable("pregame" as TourneyGameStage);
export const settings = writable({} as Settings);
export const rawSettings = writable("{}");
export const teams = writable([] as Team[]);
export const draftOrder = writable([] as number[]);

export const ownTeamIndex = derived([teams, pov], ([$teams, $pov]) => getIndexByController($teams, $pov));
export const ownTeam = derived([teams, pov], ([$teams, $pov]) => getTeamByController($teams, $pov));