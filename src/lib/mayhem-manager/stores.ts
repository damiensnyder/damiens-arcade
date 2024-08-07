import { derived, writable } from "svelte/store";
import type { MayhemManagerGameStage, Team, Fighter, Equipment, Bracket, FighterStats, PreseasonTeam, MidFightEvent, MayhemManagerExport } from "$lib/mayhem-manager/types";
import { pov } from "$lib/stores";
import { getIndexByController, getTeamByController, nextMatch as nextMatch_ } from "$lib/mayhem-manager/utils";

export const gameStage = writable("preseason" as MayhemManagerGameStage);
export const leagueExport = writable({} as MayhemManagerExport);
export const teams = writable([] as Team[] | PreseasonTeam[]);
export const ready = writable([] as boolean[]);
export const draftOrder = writable([] as number[]);
export const spotInDraftOrder = writable(0);
export const fighters = writable([] as Fighter[]);
export const equipment = writable([] as Equipment[]);
export const bracket = writable({ winner: null } as Bracket);
export const practicePicked = writable([] as (keyof FighterStats | number)[]);
export const brFighterPicked = writable(null as Fighter | null);
export const brEquipmentPicked = writable(null as Equipment[] | null);
export const equipmentPicked = writable([] as Equipment[]);
export const fightEvents = writable([] as MidFightEvent[][]);
export const watchingFight = writable(false);
export const history = writable([] as Bracket[]);
export const equipmentChoices = writable([] as number[]);

export const ownTeamIndex = derived([teams, pov], ([$teams, $pov]) => getIndexByController($teams, $pov));
export const ownTeam = derived([teams, pov], ([$teams, $pov]) => getTeamByController($teams, $pov));
export const nextMatch = derived([bracket], ([$bracket]) => nextMatch_($bracket) || {
  left: { winner: -1 },
  right: { winner: -1 },
  winner: null
});