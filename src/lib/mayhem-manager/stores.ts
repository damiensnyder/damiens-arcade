import { derived, writable } from "svelte/store";
import type { MayhemManagerGameStage, Team, Settings, Fighter, Equipment, Bracket, Map, Strategy, FighterStats, PreseasonTeam, MidFightEvent } from "$lib/mayhem-manager/types";
import { pov } from "$lib/stores";
import { getIndexByController, getTeamByController, nextMatch as nextMatch_ } from "$lib/mayhem-manager/utils";

export const gameStage = writable("preseason" as MayhemManagerGameStage);
export const settings = writable({} as Settings);
export const rawSettings = writable("{}");
export const teams = writable([] as Team[] | PreseasonTeam[]);
export const draftOrder = writable([] as number[]);
export const spotInDraftOrder = writable(0);
export const fighters = writable([] as Fighter[]);
export const equipment = writable([] as Equipment[]);
export const bracket = writable({ winner: null } as Bracket);
export const map = writable(null as (Map | null));
export const practicePicked = writable([] as (keyof FighterStats | number)[]);
export const brFighterPicked = writable(null as Fighter | null);
export const brEquipmentPicked = writable(null as Equipment[] | null);
export const brStrategyPicked = writable(null as Strategy | null);
export const equipmentPicked = writable([] as Equipment[]);
export const strategyPicked = writable([] as Strategy[]);
export const fightEvents = writable([] as MidFightEvent[][]);
export const watchingFight = writable(false);

export const ownTeamIndex = derived([teams, pov], ([$teams, $pov]) => getIndexByController($teams, $pov));
export const ownTeam = derived([teams, pov], ([$teams, $pov]) => getTeamByController($teams, $pov));
export const nextMatch = derived([bracket], ([$bracket]) => nextMatch_($bracket) || {
  left: { winner: -1 },
  right: { winner: -1 },
  winner: null
});