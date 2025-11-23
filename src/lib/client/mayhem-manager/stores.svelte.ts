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

// Game store class to allow mutation of $state properties
class GameStore {
	gameStage = $state<MayhemManagerGameStage>('preseason');
	leagueExport = $state<MayhemManagerExport>({} as MayhemManagerExport);
	teams = $state<Team[] | PreseasonTeam[]>([]);
	ready = $state<boolean[]>([]);
	draftOrder = $state<number[]>([]);
	spotInDraftOrder = $state(0);
	fighters = $state<Fighter[]>([]);
	equipment = $state<Equipment[]>([]);
	bracket = $state<Bracket>({ winner: null });
	practicePicked = $state<(keyof FighterStats | number)[]>([]);
	brFighterPicked = $state<Fighter | null>(null);
	brEquipmentPicked = $state<Equipment[] | null>(null);
	equipmentPicked = $state<Equipment[]>([]);
	fightEvents = $state<MidFightEvent[][]>([]);
	watchingFight = $state(false);
	history = $state<Bracket[]>([]);
	equipmentChoices = $state<number[]>([]);

	// Derived state (using getters to make them reactive)
	getOwnTeamIndex(pov: number): number | null {
		return getIndexByController(this.teams, pov);
	}

	getOwnTeam(pov: number): Team | PreseasonTeam | null {
		return getTeamByController(this.teams, pov);
	}

	getNextMatch(): Bracket & { left: Bracket; right: Bracket } {
		return (
			nextMatch_(this.bracket) || {
				left: { winner: -1 },
				right: { winner: -1 },
				winner: null
			}
		);
	}
}

export const gameStore = new GameStore();
