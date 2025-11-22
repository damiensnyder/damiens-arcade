import type {
	Fighter,
	PreseasonTeam,
	MayhemManagerEvent,
	MayhemManagerViewpoint,
	PreseasonViewpoint
} from '$lib/shared/mayhem-manager/types';
import * as gameStore from './stores.svelte';
import * as commonStore from '../stores.svelte';
import type { EventHandler } from '$lib/shared/common/types';

export function handleGamestate(gamestate: MayhemManagerViewpoint, pov: number): void {
	gameStore.gameStage = gamestate.gameStage;
	gameStore.history = gamestate.history;
	gameStore.teams = gamestate.teams;

	if ((gamestate as PreseasonViewpoint).ready) {
		gameStore.ready = (gamestate as PreseasonViewpoint).ready;
	} else {
		gameStore.ready = Array(gamestate.teams.length).fill(false);
	}

	if (gamestate.gameStage === 'draft' || gamestate.gameStage === 'free agency') {
		gameStore.draftOrder = gamestate.draftOrder;
		gameStore.spotInDraftOrder = gamestate.spotInDraftOrder;
		gameStore.fighters = gamestate.fighters;
	} else if (gamestate.gameStage === 'tournament') {
		gameStore.bracket = gamestate.bracket;
	}

	// Initialize equipment choices for own team
	const ownTeam = gameStore.getOwnTeam(pov);
	if (ownTeam) {
		gameStore.equipmentChoices = ownTeam.equipment.map(() => -1);
	}
}

export const eventHandler: EventHandler<MayhemManagerEvent> = {
	changeRoomSettings: function (event): void {
		commonStore.roomName = event.roomName;
		commonStore.isPublic = event.isPublic;
	},
	changeHost: function (event): void {
		commonStore.host = event.host;
	},
	join: function (event): void {
		const team: PreseasonTeam = {
			controller: event.controller,
			name: event.name,
			money: 100,
			fighters: [],
			equipment: [],
			needsResigning: [],
			needsRepair: []
		};
		gameStore.teams = [...gameStore.teams, team];
		gameStore.ready = [...gameStore.ready, false];
	},
	leave: function (event): void {
		const newTeams = [...gameStore.teams];
		newTeams[event.team].controller = 'bot';
		gameStore.teams = newTeams;

		const newReady = [...gameStore.ready];
		newReady[event.team] = false;
		gameStore.ready = newReady;
	},
	replace: function (event): void {
		const newTeams = [...gameStore.teams];
		newTeams[event.team].controller = event.controller;
		gameStore.teams = newTeams;

		if (event.controller === commonStore.pov) {
			const team = newTeams[event.team];
			gameStore.equipmentChoices = team.equipment.map(() => -1);
		}
	},
	remove: function (event): void {
		const newTeams = [...gameStore.teams];
		newTeams.splice(event.team, 1);
		gameStore.teams = newTeams;

		const newReady = [...gameStore.ready];
		newReady.splice(event.team, 1);
		gameStore.ready = newReady;
	},
	ready: function (event): void {
		const newReady = [...gameStore.ready];
		newReady[event.team] = true;
		gameStore.ready = newReady;
	},
	resign: function (event): void {
		const newTeams = [...gameStore.teams];
		const team = newTeams[event.team] as PreseasonTeam;
		const fighterResigned = team.needsResigning.splice(event.fighter, 1)[0];
		team.fighters.push(fighterResigned);
		team.money -= fighterResigned.price;
		fighterResigned.price = 0;
		gameStore.teams = newTeams;
	},
	repair: function (event): void {
		const newTeams = [...gameStore.teams];
		const team = newTeams[event.team] as PreseasonTeam;
		const equipmentRepaired = team.needsRepair.splice(event.equipment, 1)[0];
		team.equipment.push(equipmentRepaired);
		team.money -= equipmentRepaired.price;
		gameStore.teams = newTeams;
	},
	goToDraft: function (event): void {
		gameStore.gameStage = 'draft';
		gameStore.draftOrder = event.draftOrder;
		gameStore.spotInDraftOrder = 0;
		gameStore.fighters = event.fighters;
	},
	pick: function (event): void {
		const newFighters = [...gameStore.fighters];
		const fighterPicked = newFighters.splice(event.fighter, 1)[0];
		gameStore.fighters = newFighters;

		const newTeams = [...gameStore.teams];
		const teamThatPicked = newTeams[gameStore.draftOrder[gameStore.spotInDraftOrder]];
		teamThatPicked.fighters.push(fighterPicked);
		if (typeof fighterPicked.price === 'number') {
			teamThatPicked.money -= fighterPicked.price;
		}
		gameStore.teams = newTeams;

		if (gameStore.gameStage === 'draft') {
			gameStore.spotInDraftOrder++;
		}
	},
	pass: function (_event): void {
		gameStore.spotInDraftOrder++;
	},
	goToFA: function (event): void {
		gameStore.gameStage = 'free agency';
		gameStore.fighters = event.fighters;
		gameStore.draftOrder = [...gameStore.draftOrder].reverse();
		gameStore.spotInDraftOrder = 0;
	},
	goToTraining: function (event): void {
		gameStore.gameStage = 'training';
		gameStore.equipment = event.equipment || [];
		gameStore.ready = Array(gameStore.ready.length).fill(false);
	},
	goToBR: function (event): void {
		gameStore.gameStage = 'battle royale';
		gameStore.teams = event.teams;
		if (gameStore.getOwnTeamIndex(commonStore.pov) !== null) {
			const ownTeam = gameStore.getOwnTeam(commonStore.pov);
			if (ownTeam) {
				gameStore.equipmentChoices = ownTeam.equipment.map(() => -1);
			}
		}
		gameStore.ready = Array(gameStore.ready.length).fill(false);
	},
	fight: function (event): void {
		gameStore.fightEvents = event.eventLog;
		gameStore.watchingFight = true;
	},
	bracket: function (event): void {
		gameStore.gameStage = 'tournament';
		gameStore.bracket = event.bracket;
	},
	goToPreseason: function (event): void {
		gameStore.watchingFight = false;
		gameStore.fightEvents = [];
		gameStore.history = event.history;
		gameStore.gameStage = 'preseason';
		gameStore.teams = event.teams;
		gameStore.ready = Array(gameStore.ready.length).fill(false);
	},
	exportLeague: function (event): void {
		gameStore.leagueExport = event.league;
	}
};
