import { derived, writable } from "svelte/store";
import type { TourneyGameStage, Team, Settings, Fighter, Equipment, Bracket, Map, Strategy, FighterStats, PreseasonTeam } from "$lib/tourney/types";
import { pov } from "$lib/stores";
import { getIndexByController, getTeamByController } from "$lib/tourney/utils";

export const gameStage = writable("pregame" as TourneyGameStage);
export const settings = writable({} as Settings);
export const rawSettings = writable("{}");
export const teams = writable([] as Team[] | PreseasonTeam[]);
export const draftOrder = writable([] as number[]);
export const spotInDraftOrder = writable(0);
export const fighters = writable([] as Fighter[]);
export const equipment = writable([] as Equipment[]);
export const bracket = writable({ winner: -1 } as Bracket);
export const map = writable(null as (Map | null));
export const practicePicked = writable([] as (keyof FighterStats | number)[]);
export const brFighterPicked = writable(null as Fighter | null);
export const brEquipmentPicked = writable(null as Equipment[] | null);
export const brStrategyPicked = writable(null as Strategy | null);
export const equipmentPicked = writable([] as Equipment[]);
export const strategyPicked = writable([] as Strategy[]);

export const ownTeamIndex = derived([teams, pov], ([$teams, $pov]) => getIndexByController($teams, $pov));
export const ownTeam = derived([teams, pov], ([$teams, $pov]) => getTeamByController($teams, $pov));