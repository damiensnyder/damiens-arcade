import type {
	MayhemManagerGameStage,
	Team,
	Fighter,
	Equipment,
	Bracket,
	FighterStats,
	PreseasonTeam,
	MidFightEvent,
	MayhemManagerExport
} from '$lib/shared/mayhem-manager/types';
import { getIndexByController, getTeamByController, nextMatch as nextMatch_ } from '$lib/shared/mayhem-manager/utils';

// State
export let gameStage = $state<MayhemManagerGameStage>('preseason');
export let leagueExport = $state<MayhemManagerExport>({} as MayhemManagerExport);
export let teams = $state<Team[] | PreseasonTeam[]>([]);
export let ready = $state<boolean[]>([]);
export let draftOrder = $state<number[]>([]);
export let spotInDraftOrder = $state(0);
export let fighters = $state<Fighter[]>([]);
export let equipment = $state<Equipment[]>([]);
export let bracket = $state<Bracket>({ winner: null });
export let practicePicked = $state<(keyof FighterStats | number)[]>([]);
export let brFighterPicked = $state<Fighter | null>(null);
export let brEquipmentPicked = $state<Equipment[] | null>(null);
export let equipmentPicked = $state<Equipment[]>([]);
export let fightEvents = $state<MidFightEvent[][]>([]);
export let watchingFight = $state(false);
export let history = $state<Bracket[]>([]);
export let equipmentChoices = $state<number[]>([]);

// Derived state (using getters to make them reactive)
export function getOwnTeamIndex(pov: number): number | null {
	return getIndexByController(teams, pov);
}

export function getOwnTeam(pov: number): Team | PreseasonTeam | null {
	return getTeamByController(teams, pov);
}

export function getNextMatch(): Bracket & { left: Bracket; right: Bracket } {
	return (
		nextMatch_(bracket) || {
			left: { winner: -1 },
			right: { winner: -1 },
			winner: null
		}
	);
}
