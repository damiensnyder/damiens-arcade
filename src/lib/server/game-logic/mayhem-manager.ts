import type { Viewer, ActionResult } from '$lib/shared/common/types';
import { GameLogicBase } from './base';
import type {
	MayhemManagerGameStage,
	MayhemManagerViewpoint,
	ViewpointBase,
	Team,
	Fighter,
	Bracket,
	Equipment,
	PreseasonTeam,
	MayhemManagerExport,
	MayhemManagerAction,
	MayhemManagerEvent
} from '$lib/shared/mayhem-manager/types';
import { StatName } from '$lib/shared/mayhem-manager/types';
import {
	getIndexByController,
	getTeamByController,
	isValidEquipmentFighter,
	isValidEquipmentTournament,
	nextMatch
} from '$lib/shared/mayhem-manager/utils';
import Bot from './mayhem-manager-bot';
import {
	AddBotSchema,
	AdvanceSchema,
	ExportLeagueSchema,
	ImportSchema,
	JoinSchema,
	LeaveSchema,
	PassSchema,
	PickBRFighterSchema,
	PickFightersSchema,
	PickSchema,
	PracticeSchema,
	ReadySchema,
	RemoveSchema,
	RepairSchema,
	ReplaceSchema,
	ResignSchema
} from '$lib/shared/mayhem-manager/schemas';
import {
	generateFighters,
	generateEightEquipment,
	SHIRT_COLORS,
	SHORTS_COLORS
} from '$lib/shared/mayhem-manager/create-from-catalogs';
import { Fight } from '$lib/shared/mayhem-manager/fight';
import { FighterInBattle } from '$lib/shared/mayhem-manager/fighter-in-battle';
import { fighterValue } from '$lib/shared/mayhem-manager/fighter-value';



const TEAM_NAME_STARTS = [
  "Fabulous",
  "Marvelous",
  "Eccentric",
  "Smashin'",
  "Swarthy",
  "Rugged",
  "Rootin' Tootin'",
  "Sprightly",
  "Wonderful",
  "Ludicrous",
  "Courageous",
  "Wise",
  "Worrisome",
  "Flippin'",
  "Unknown",
  "Lovely",
  "Healthy",
  "Blue",
  "Nefarious",
  "Unusual"
];
const TEAM_NAME_ENDS = [
  "Bashers",
  "Mastodons",
  "Birds",
  "Parakeets",
  "Marigolds",
  "Whirlwinds",
  "Apricots",
  "Yaks",
  "Specters",
  "Monocles",
  "Manatees",
  "Bakers",
  "Wallabies",
  "Cats",
  "Sprites",
  "Locksmiths",
  "Pickles",
  "Pandas",
  "Melonheads",
  "Wombats"
];

const BOT_DELAY = 2000;

export class MayhemManagerLogic extends GameLogicBase<
	{ gameStage: MayhemManagerGameStage; [key: string]: any },
	MayhemManagerAction,
	MayhemManagerEvent,
	MayhemManagerViewpoint
> {
	gameStage: MayhemManagerGameStage;
	teams: (Team | PreseasonTeam)[];
	ready: boolean[];
	draftOrder?: number[];
	spotInDraftOrder?: number;
	fighters?: Fighter[];
	unsignedVeterans?: Fighter[];
	equipmentAvailable?: Equipment[][];
	trainingChoices?: { equipment: number[]; skills: (number | StatName)[] }[];
	fightersInBattle?: FighterInBattle[];
	map?: number;
	bracket?: Bracket;
	nextMatch?: Bracket & { left: Bracket; right: Bracket };
	history: Bracket[];
	pickTimeout?: NodeJS.Timeout;

	initialState() {
		return {
			gameStage: 'preseason' as MayhemManagerGameStage,
			teams: [],
			history: [],
			ready: []
		};
	}

	constructor(roomCode: string, roomName: string, isPublic: boolean) {
		super(roomCode, roomName, isPublic);
		this.gameStage = 'preseason';
		this.teams = [];
		this.history = [];
		this.ready = [];
	}

	handleAction(viewer: Viewer, rawAction: unknown): ActionResult<MayhemManagerEvent> {
		const indexControlledByViewer = getIndexByController(this.teams, viewer.index);
		const teamControlledByViewer = getTeamByController(this.teams, viewer.index);

		// JOIN
		const joinParsed = JoinSchema.safeParse(rawAction);
		if (
			joinParsed.success &&
			this.gameStage === 'preseason' &&
			teamControlledByViewer === null &&
			this.teams.length < 16 &&
			!this.teams.some((t) => t.name === joinParsed.data.name)
		) {
			return this.handleJoin(viewer.index, joinParsed.data.name);
		}

		// LEAVE
		const leaveParsed = LeaveSchema.safeParse(rawAction);
		if (leaveParsed.success && teamControlledByViewer !== null && indexControlledByViewer !== null) {
			return this.handleLeave(indexControlledByViewer);
		}

		// REPLACE
		const replaceParsed = ReplaceSchema.safeParse(rawAction);
		if (
			replaceParsed.success &&
			teamControlledByViewer === null &&
			replaceParsed.data.team < this.teams.length &&
			this.teams[replaceParsed.data.team].controller === 'bot'
		) {
			return this.handleReplace(viewer, replaceParsed.data.team);
		}

		// REMOVE
		const removeParsed = RemoveSchema.safeParse(rawAction);
		if (
			removeParsed.success &&
			this.gameStage === 'preseason' &&
			viewer.isHost &&
			removeParsed.data.team < this.teams.length
		) {
			return this.handleRemove(removeParsed.data.team);
		}

		// READY
		const readyParsed = ReadySchema.safeParse(rawAction);
		if (
			readyParsed.success &&
			this.gameStage === 'preseason' &&
			indexControlledByViewer !== null
		) {
			return this.handleReady(indexControlledByViewer);
		}

		// ADD BOT
		const addBotParsed = AddBotSchema.safeParse(rawAction);
		if (
			addBotParsed.success &&
			this.gameStage === 'preseason' &&
			this.teams.length < 16 &&
			viewer.isHost
		) {
			return this.handleAddBot();
		}

		// ADVANCE
		const advanceParsed = AdvanceSchema.safeParse(rawAction);
		if (advanceParsed.success && viewer.isHost) {
			return this.handleAdvance();
		}

		// PICK (draft or free agency)
		const pickParsed = PickSchema.safeParse(rawAction);
		if (
			pickParsed.success &&
			indexControlledByViewer !== null &&
			(this.gameStage === 'draft' || this.gameStage === 'free agency')
		) {
			return this.handlePick(indexControlledByViewer, pickParsed.data.index);
		}

		// PASS (free agency)
		const passParsed = PassSchema.safeParse(rawAction);
		if (
			passParsed.success &&
			indexControlledByViewer !== null &&
			this.gameStage === 'free agency'
		) {
			return this.handlePass();
		}

		// PRACTICE (training)
		const practiceParsed = PracticeSchema.safeParse(rawAction);
		if (
			practiceParsed.success &&
			this.gameStage === 'training' &&
			indexControlledByViewer !== null &&
			teamControlledByViewer &&
			!this.ready[indexControlledByViewer] &&
			practiceParsed.data.skills.length === teamControlledByViewer.fighters.length
		) {
			return this.handlePractice(
				indexControlledByViewer,
				practiceParsed.data.equipment,
				practiceParsed.data.skills
			);
		}

		// PICK BR FIGHTER (battle royale)
		const pickBRParsed = PickBRFighterSchema.safeParse(rawAction);
		if (
			pickBRParsed.success &&
			this.gameStage === 'battle royale' &&
			indexControlledByViewer !== null &&
			teamControlledByViewer
		) {
			return this.handlePickBRFighter(
				indexControlledByViewer,
				pickBRParsed.data.fighter,
				pickBRParsed.data.equipment
			);
		}

		// PICK FIGHTERS (tournament)
		const pickFightersParsed = PickFightersSchema.safeParse(rawAction);
		if (
			pickFightersParsed.success &&
			this.gameStage === 'tournament' &&
			indexControlledByViewer !== null &&
			teamControlledByViewer
		) {
			return this.handlePickFighters(indexControlledByViewer, pickFightersParsed.data.equipment);
		}

		// RESIGN
		const resignParsed = ResignSchema.safeParse(rawAction);
		if (
			resignParsed.success &&
			this.gameStage === 'preseason' &&
			indexControlledByViewer !== null &&
			teamControlledByViewer
		) {
			return this.handleResign(indexControlledByViewer, resignParsed.data.fighter);
		}

		// REPAIR
		const repairParsed = RepairSchema.safeParse(rawAction);
		if (
			repairParsed.success &&
			this.gameStage === 'preseason' &&
			indexControlledByViewer !== null &&
			teamControlledByViewer
		) {
			return this.handleRepair(indexControlledByViewer, repairParsed.data.equipment);
		}

		// IMPORT
		const importParsed = ImportSchema.safeParse(rawAction);
		if (importParsed.success && viewer.isHost && this.gameStage === 'preseason') {
			return this.handleImport(importParsed.data);
		}

		// EXPORT
		const exportParsed = ExportLeagueSchema.safeParse(rawAction);
		if (exportParsed.success && viewer.isHost) {
			return this.handleExport();
		}

		return { success: false, error: 'Invalid action' };
	}

	// Action handlers - these will return ActionResult
	private handleJoin(
		viewerIndex: number,
		name: string
	): ActionResult<MayhemManagerEvent> {
		const team: PreseasonTeam = {
			controller: viewerIndex,
			name,
			money: 100,
			fighters: [],
			equipment: [],
			needsResigning: [],
			needsRepair: []
		};
		this.teams.push(team);
		this.ready.push(false);
		return {
			success: true,
			events: [{ type: 'join', controller: viewerIndex, name }]
		};
	}

	private handleLeave(teamIndex: number): ActionResult<MayhemManagerEvent> {
		this.teams[teamIndex].controller = 'bot';
		this.ready[teamIndex] = false;
		return {
			success: true,
			events: [{ type: 'leave', team: teamIndex }]
		};
	}

	private handleReplace(viewer: Viewer, teamIndex: number): ActionResult<MayhemManagerEvent> {
		this.teams[teamIndex].controller = viewer.index;
		const events: MayhemManagerEvent[] = [
			{ type: 'replace', team: teamIndex, controller: viewer.index }
		];

		// If in training, also send equipment available
		if (this.gameStage === 'training' && this.equipmentAvailable) {
			events.push({
				type: 'goToTraining',
				equipment: this.equipmentAvailable[teamIndex]
			});
		}

		return { success: true, events };
	}

	private handleRemove(teamIndex: number): ActionResult<MayhemManagerEvent> {
		this.teams.splice(teamIndex, 1);
		this.ready.splice(teamIndex, 1);
		return {
			success: true,
			events: [{ type: 'remove', team: teamIndex }]
		};
	}

	private handleReady(teamIndex: number): ActionResult<MayhemManagerEvent> {
		this.ready[teamIndex] = true;
		const events: MayhemManagerEvent[] = [{ type: 'ready', team: teamIndex }];

		// Check if all non-bot players are ready and we have 2+ teams
		const allReady =
			this.teams.every(
				(team: PreseasonTeam, i: number) => this.ready[i] || team.controller === 'bot'
			) && this.teams.length >= 2;

		if (allReady) {
			// Advance to draft
			events.push(...this.advanceToDraft());
		}

		return { success: true, events };
	}

	private handleAddBot(): ActionResult<MayhemManagerEvent> {
		const name = generateTeamName(this.teams, this.randElement.bind(this));
		const team: PreseasonTeam = {
			controller: 'bot',
			name,
			money: 100,
			fighters: [],
			equipment: [],
			needsResigning: [],
			needsRepair: []
		};
		this.teams.push(team);
		this.ready.push(false);
		return {
			success: true,
			events: [{ type: 'join', controller: 'bot', name }]
		};
	}

	private handleAdvance(): ActionResult<MayhemManagerEvent> {
		const events = this.advance();
		return { success: true, events };
	}

	private handlePick(teamIndex: number, fighterIndex: number): ActionResult<MayhemManagerEvent> {
		if (!this.fighters || fighterIndex >= this.fighters.length) {
			return { success: false, error: 'Invalid fighter index' };
		}

		const fighter = this.fighters[fighterIndex];
		const team = this.teams[teamIndex] as Team;

		if (team.money < fighter.price) {
			return { success: false, error: 'Not enough money' };
		}

		// Pick the fighter
		team.fighters.push(fighter);
		team.money -= fighter.price;
		this.fighters.splice(fighterIndex, 1);

		const events: MayhemManagerEvent[] = [{ type: 'pick', fighter: fighterIndex }];

		// Check if we need to advance
		if (this.gameStage === 'draft') {
			this.spotInDraftOrder!++;
			if (
				this.spotInDraftOrder === this.draftOrder!.length ||
				this.teams[this.draftOrder![this.spotInDraftOrder!]].controller === 'bot'
			) {
				events.push(...this.advance());
			}
		}

		return { success: true, events };
	}

	private handlePass(): ActionResult<MayhemManagerEvent> {
		this.spotInDraftOrder!++;
		const events: MayhemManagerEvent[] = [{ type: 'pass' }];

		if (
			this.spotInDraftOrder === this.draftOrder!.length ||
			this.teams[this.draftOrder![this.spotInDraftOrder!]].controller === 'bot'
		) {
			events.push(...this.advance());
		}

		return { success: true, events };
	}

	private handlePractice(
		teamIndex: number,
		equipment: number[],
		skills: (number | StatName)[]
	): ActionResult<MayhemManagerEvent> {
		this.trainingChoices![teamIndex] = { equipment, skills };
		this.ready[teamIndex] = true;
		const events: MayhemManagerEvent[] = [{ type: 'ready', team: teamIndex }];

		// Check if all non-bot teams are ready
		if (
			this.teams.every((team, i) => this.ready[i] || team.controller === 'bot') &&
			this.teams.length >= 2
		) {
			events.push(...this.advanceToBattleRoyale());
		}

		return { success: true, events };
	}

	private handlePickBRFighter(
		teamIndex: number,
		fighter: number,
		equipment: number[]
	): ActionResult<MayhemManagerEvent> {
		const team = this.teams[teamIndex] as Team;

		if (fighter >= team.fighters.length) {
			return { success: false, error: 'Invalid fighter index' };
		}

		if (!isValidEquipmentFighter(team, equipment)) {
			return { success: false, error: 'Invalid equipment configuration' };
		}

		this.submitBRPick(teamIndex, fighter, equipment);
		this.ready[teamIndex] = true;

		const events: MayhemManagerEvent[] = [];

		// Check if all teams ready
		if (this.teams.every((team, i) => this.ready[i] || team.controller === 'bot')) {
			// All teams ready, simulate BR
			events.push(...this.simulateBattleRoyale());
		}

		return { success: true, events };
	}

	private handlePickFighters(
		teamIndex: number,
		equipment: number[][]
	): ActionResult<MayhemManagerEvent> {
		const team = this.teams[teamIndex] as Team;

		if (!isValidEquipmentTournament(team, equipment)) {
			return { success: false, error: 'Invalid equipment configuration' };
		}

		this.submitFightPicks(teamIndex, equipment);
		this.ready[teamIndex] = true;

		const events: MayhemManagerEvent[] = [];

		// Check if both teams in match are ready
		const match = nextMatch(this.bracket!);
		const leftTeam = match.left.winner as number;
		const rightTeam = match.right.winner as number;

		if (this.ready[leftTeam] && this.ready[rightTeam]) {
			// Both teams ready, simulate fight
			events.push(...this.simulateFight());
		}

		return { success: true, events };
	}

	private handleResign(
		teamIndex: number,
		fighterIndex: number
	): ActionResult<MayhemManagerEvent> {
		const team = this.teams[teamIndex] as PreseasonTeam;

		if (fighterIndex >= team.needsResigning.length) {
			return { success: false, error: 'Invalid fighter index' };
		}

		const fighter = team.needsResigning[fighterIndex];
		if (team.money < fighter.price) {
			return { success: false, error: 'Not enough money' };
		}

		team.fighters.push(fighter);
		team.money -= fighter.price;
		team.needsResigning.splice(fighterIndex, 1);

		return {
			success: true,
			events: [{ type: 'resign', team: teamIndex, fighter: fighterIndex }]
		};
	}

	private handleRepair(
		teamIndex: number,
		equipmentIndex: number
	): ActionResult<MayhemManagerEvent> {
		const team = this.teams[teamIndex] as PreseasonTeam;

		if (equipmentIndex >= team.needsRepair.length) {
			return { success: false, error: 'Invalid equipment index' };
		}

		const equipment = team.needsRepair[equipmentIndex];
		if (team.money < equipment.price) {
			return { success: false, error: 'Not enough money' };
		}

		team.equipment.push(equipment);
		team.money -= equipment.price;
		team.needsRepair.splice(equipmentIndex, 1);

		return {
			success: true,
			events: [{ type: 'repair', team: teamIndex, equipment: equipmentIndex }]
		};
	}

	private handleImport(league: MayhemManagerExport): ActionResult<MayhemManagerEvent> {
		this.importLeague(league);
		return { success: true, events: [] };
	}

	private handleExport(): ActionResult<MayhemManagerEvent> {
		const league = this.exportLeague();
		return {
			success: true,
			events: [{ type: 'exportLeague', league }]
		};
	}

	// Helper methods - these will return event arrays
	private advance(): MayhemManagerEvent[] {
		clearTimeout(this.pickTimeout);

		if (this.gameStage === 'preseason' && this.teams.length >= 1) {
			return this.advanceToDraft();
		} else if (this.gameStage === 'draft') {
			if (this.spotInDraftOrder === this.draftOrder.length) {
				return this.advanceToFreeAgency();
			} else {
				const pickingTeam = this.teams[this.draftOrder[this.spotInDraftOrder]];
				const events: MayhemManagerEvent[] = [];
				if (pickingTeam.controller !== 'bot') {
					// Have bot pick for human player
					const pick = Bot.getDraftPick(pickingTeam, this.fighters);
					const fighter = this.fighters[pick];
					pickingTeam.fighters.push(fighter);
					pickingTeam.money -= fighter.price;
					this.fighters.splice(pick, 1);
					this.spotInDraftOrder++;
					events.push({ type: 'pick', fighter: pick });
				}
				if (this.spotInDraftOrder === this.draftOrder.length) {
					events.push(...this.advanceToFreeAgency());
				} else {
					this.pickTimeout = setTimeout(() => this.doBotDraftPick(), BOT_DELAY);
				}
				return events;
			}
		} else if (this.gameStage === 'free agency') {
			if (this.spotInDraftOrder === this.draftOrder.length) {
				return this.advanceToTraining();
			} else {
				const events: MayhemManagerEvent[] = [];
				const pickingTeam = this.teams[this.draftOrder[this.spotInDraftOrder]];
				if (pickingTeam.controller !== 'bot') {
					events.push({ type: 'pass' });
					this.spotInDraftOrder++;
				}
				if (this.spotInDraftOrder === this.draftOrder.length) {
					events.push(...this.advanceToTraining());
				} else {
					this.pickTimeout = setTimeout(() => this.doBotFAPick(), BOT_DELAY);
				}
				return events;
			}
		} else if (this.gameStage === 'training') {
			// Fill in bot training choices
			for (let i = 0; i < this.teams.length; i++) {
				if (!this.ready[i]) {
					const trainingPicks = Bot.getTrainingPicks(this.teams[i], this.equipmentAvailable[i]);
					this.trainingChoices[i] = {
						equipment: trainingPicks.equipment,
						skills: trainingPicks.skills
					};
				}
			}
			return this.advanceToBattleRoyale();
		} else if (this.gameStage === 'battle royale') {
			// Get bot picks from unready players
			for (let i = 0; i < this.teams.length; i++) {
				if (!this.ready[i]) {
					const brPicks = Bot.getBRPicks(this.teams[i]);
					this.fightersInBattle.push(
						new FighterInBattle(
							this.teams[i].fighters[brPicks.fighter],
							brPicks.equipment.map((e) => this.teams[i].equipment[e]),
							i
						)
					);
					this.ready[i] = true;
				}
			}
			return this.simulateBattleRoyale();
		} else if (this.gameStage === 'tournament') {
			if (this.bracket.winner !== null) {
				return this.advanceToPreseason();
			} else {
				// Get bot picks from unready players
				for (let i = 0; i < this.teams.length; i++) {
					if (!this.ready[i]) {
						const fightPicks = Bot.getFightPicks(this.teams[i]);
						for (let j = 0; j < this.teams[i].fighters.length; j++) {
							this.fightersInBattle.push(
								new FighterInBattle(
									this.teams[i].fighters[j],
									fightPicks[j].map((e) => this.teams[i].equipment[e]),
									i
								)
							);
						}
						this.ready[i] = true;
					}
				}
				return this.simulateFight();
			}
		}
		return [];
	}

	private advanceToDraft(): MayhemManagerEvent[] {
		this.gameStage = 'draft';
		const events: MayhemManagerEvent[] = [];

		// Get picks from bot teams
		this.teams.forEach((team: PreseasonTeam, i) => {
			if (team.controller === 'bot') {
				const picks = Bot.getPreseasonPicks(team);
				picks.fighters.forEach((f, j) => {
					const fighterIndex = f - j;
					if (fighterIndex < team.needsResigning.length && team.money >= team.needsResigning[fighterIndex].price) {
						const fighter = team.needsResigning.splice(fighterIndex, 1)[0];
						team.fighters.push(fighter);
						team.money -= fighter.price;
						fighter.price = 0;
						events.push({ type: 'resign', team: i, fighter: fighterIndex });
					}
				});
				picks.equipment.forEach((e, j) => {
					const equipmentIndex = e - j;
					if (equipmentIndex < team.needsRepair.length && team.money >= team.needsRepair[equipmentIndex].price) {
						const equipment = team.needsRepair.splice(equipmentIndex, 1)[0];
						team.money -= equipment.price;
						equipment.price = 0;
						team.equipment.push(equipment);
						events.push({ type: 'repair', team: i, equipment: equipmentIndex });
					}
				});
			}
		});

		// Collect unsigned veterans
		this.unsignedVeterans = [];
		this.teams.forEach((team: PreseasonTeam) => {
			this.unsignedVeterans = this.unsignedVeterans.concat(team.needsResigning);
		});

		// Draft order is reverse order of results of previous tournament
		this.draftOrder = [];
		for (let i = 0; i < this.teams.length; i++) {
			this.draftOrder.push(i);
		}
		const lastBracket = this.history.length > 0 ? this.history[this.history.length - 1] : undefined;
		this.draftOrder.sort((a, b) => {
			return (
				levelInBracket(lastBracket, this.teams[b].name) -
				levelInBracket(lastBracket, this.teams[a].name)
			);
		});
		this.spotInDraftOrder = 0;

		// Generate random fighters to draft
		this.fighters = generateFighters(Math.ceil(this.teams.length * 1.5 + 1), false, this);
		this.fighters.sort((a, b) => fighterValue(b) - fighterValue(a));

		events.push({
			type: 'goToDraft',
			draftOrder: this.draftOrder,
			fighters: this.fighters
		});

		clearTimeout(this.pickTimeout);
		this.pickTimeout = setTimeout(() => this.doBotDraftPick(), BOT_DELAY);

		return events;
	}

	private doBotDraftPick(): void {
		clearTimeout(this.pickTimeout);

		if (this.gameStage !== 'draft' || this.spotInDraftOrder >= this.draftOrder.length) return;
		const pickingTeam = this.teams[this.draftOrder[this.spotInDraftOrder]];
		if (pickingTeam.controller !== 'bot') return;

		const pick = Bot.getDraftPick(pickingTeam, this.fighters);
		const fighter = this.fighters[pick];
		pickingTeam.fighters.push(fighter);
		pickingTeam.money -= fighter.price;
		this.fighters.splice(pick, 1);
		this.spotInDraftOrder++;

		// Emit the pick event immediately
		// Note: In new architecture, this would be emitted via event return, but bot automation
		// runs via setTimeout so we need a different pattern here (will be handled by room layer)

		if (this.spotInDraftOrder === this.draftOrder.length) {
			this.pickTimeout = setTimeout(() => {
				// This will trigger through the room layer
			}, BOT_DELAY);
		} else {
			this.pickTimeout = setTimeout(() => this.doBotDraftPick(), BOT_DELAY);
		}
	}

	private advanceToFreeAgency(): MayhemManagerEvent[] {
		clearTimeout(this.pickTimeout);

		this.gameStage = 'free agency';
		this.draftOrder.reverse();
		this.spotInDraftOrder = 0;

		// Combine unsigned veterans and undrafted fighters
		this.fighters = this.unsignedVeterans.concat(this.fighters);
		this.fighters = this.fighters.concat(
			generateFighters(
				Math.ceil(this.teams.length * 1.5 + 1) - this.fighters.length,
				false,
				this
			)
		);

		// Set prices based on fighter quality
		for (const fighter of this.fighters) {
			fighter.price = Math.floor(1.35 * fighterValue(fighter) + this.randInt(-5, 5));
		}
		this.fighters.sort((a, b) => b.price - a.price);

		this.pickTimeout = setTimeout(() => this.doBotFAPick(), BOT_DELAY);

		return [{ type: 'goToFA', fighters: this.fighters }];
	}

	private doBotFAPick(): void {
		clearTimeout(this.pickTimeout);

		if (
			this.gameStage !== 'free agency' ||
			this.spotInDraftOrder >= this.draftOrder.length
		)
			return;
		const pickingTeam = this.teams[this.draftOrder[this.spotInDraftOrder]];
		if (pickingTeam.controller !== 'bot') return;

		const picks = Bot.getFAPicks(pickingTeam, this.fighters);
		for (const pick of picks) {
			if (pick < this.fighters.length && pickingTeam.money >= this.fighters[pick].price) {
				const fighter = this.fighters.splice(pick, 1)[0];
				pickingTeam.fighters.push(fighter);
				pickingTeam.money -= fighter.price;
			}
		}
		this.spotInDraftOrder++;

		if (this.spotInDraftOrder === this.draftOrder.length) {
			this.pickTimeout = setTimeout(() => {
				// This will trigger through the room layer
			}, BOT_DELAY);
		} else {
			this.pickTimeout = setTimeout(() => this.doBotFAPick(), BOT_DELAY);
		}
	}

	private advanceToTraining(): MayhemManagerEvent[] {
		clearTimeout(this.pickTimeout);

		this.gameStage = 'training';
		delete this.fighters;
		delete this.draftOrder;
		delete this.spotInDraftOrder;

		this.trainingChoices = Array(this.teams.length);
		this.equipmentAvailable = [];
		this.ready = Array(this.teams.length).fill(false);

		for (let i = 0; i < this.teams.length; i++) {
			const equipment = generateEightEquipment(this);
			this.equipmentAvailable.push(equipment);
		}

		// Return a goToTraining event - the room layer will handle per-viewer equipment
		return [{ type: 'goToTraining' }];
	}

	private advanceToBattleRoyale(): MayhemManagerEvent[] {
		// Set team colors and save old stats
		let i = 0;
		for (const team of this.teams) {
			for (const fighter of team.fighters) {
				fighter.oldStats = { ...fighter.stats };
				fighter.appearance.shirtColor = SHIRT_COLORS[i % 6];
				fighter.appearance.shortsColor = SHORTS_COLORS[i % 5];
			}
			i++;
		}

		// Apply training choices
		this.trainingChoices.forEach((choice, i) => {
			const team = this.teams[i];
			const e = this.equipmentAvailable[i];
			choice.equipment.forEach((equipmentIndex) => {
				if (
					equipmentIndex >= 0 &&
					equipmentIndex < e.length &&
					team.money >= e[equipmentIndex].price
				) {
					const equipmentPicked = e.splice(equipmentIndex, 1)[0];
					team.equipment.push(equipmentPicked);
					team.money = Math.round(team.money - equipmentPicked.price);
					equipmentPicked.price = 0;
				}
			});
			choice.skills.forEach((skill, j) => {
				if (typeof skill === 'number' && skill >= 0 && skill < team.equipment.length) {
					team.fighters[j].attunements.push(team.equipment[skill].name);
				} else if (
					typeof skill === 'string' &&
					Object.values(StatName).includes(skill) &&
					team.fighters[j].stats[skill] < 10
				) {
					team.fighters[j].stats[skill] += 1;
				}
				this.doAgeBasedDevelopment(team.fighters[j]);
			});
		});
		delete this.trainingChoices;
		delete this.equipmentAvailable;

		this.gameStage = 'battle royale';
		this.fightersInBattle = [];
		this.ready.fill(false);

		// Clean up old stats
		for (const team of this.teams) {
			for (const fighter of team.fighters) {
				delete fighter.oldStats;
			}
		}

		return [{ type: 'goToBR', teams: this.teams }];
	}

	private doAgeBasedDevelopment(f: Fighter) {
		for (const stat in f.stats) {
			if (this.randReal() < 0.5) {
				let change = (2 / 3) * (this.randReal() + this.randReal() + this.randReal() - 1.5);
				if (f.experience <= 2 || f.experience >= 12) {
					change *= 2;
				}
				change += (3 - f.experience) / 12;
				f.stats[stat] = Math.min(Math.max(f.stats[stat] + Math.round(change), 0), 10);
			}
		}
	}

	private simulateBattleRoyale(): MayhemManagerEvent[] {
		const fight = new Fight(this, this.fightersInBattle);
		fight.simulate();

		this.bracket = generateBracket(
			fight.placementOrder.map((team) => {
				return { winner: team };
			})
		);
		this.gameStage = 'tournament';

		const events: MayhemManagerEvent[] = [
			{ type: 'fight', eventLog: fight.eventLog },
			...this.prepareForNextMatch()
		];

		return events;
	}

	private simulateFight(): MayhemManagerEvent[] {
		const fight = new Fight(this, this.fightersInBattle);
		fight.simulate();

		this.nextMatch.winner = fight.placementOrder[0];

		const events: MayhemManagerEvent[] = [
			{ type: 'fight', eventLog: fight.eventLog },
			...this.prepareForNextMatch()
		];

		return events;
	}

	private prepareForNextMatch(): MayhemManagerEvent[] {
		delete this.map;
		this.fightersInBattle = [];

		if (this.bracket.winner !== null) {
			delete this.nextMatch;
			return [{ type: 'bracket', bracket: this.bracket }];
		}

		this.nextMatch = nextMatch(this.bracket);
		this.ready = Array(this.teams.length).fill(true);
		this.ready[this.nextMatch.left.winner as number] = false;
		this.ready[this.nextMatch.right.winner as number] = false;

		return [{ type: 'bracket', bracket: this.bracket }];
	}

	private advanceToPreseason(): MayhemManagerEvent[] {
		this.teams.forEach((team: PreseasonTeam) => {
			team.needsResigning = team.fighters.filter((fighter) => {
				fighter.experience++;
				if (fighter.experience % 2 === 1) {
					fighter.price = Math.floor(fighterValue(fighter)) + this.randInt(-5, 5);
					return true;
				}
				return false;
			});
			team.fighters = team.fighters.filter((fighter) => fighter.experience % 2 !== 1);

			team.needsRepair = team.equipment.filter((equipment) => {
				equipment.yearsOwned++;
				if (equipment.yearsOwned % 2 === 0) {
					equipment.price = 3 * equipment.yearsOwned + this.randInt(1, 7);
					return true;
				}
				return false;
			});
			team.equipment = team.equipment.filter((equipment) => equipment.yearsOwned % 2 !== 0);
			team.money = Math.ceil(team.money / 2 + 100);
		});

		this.ready = Array(this.teams.length).fill(false);
		delete this.fightersInBattle;
		delete this.map;

		this.history.push(preserveBracket(this.bracket, this.teams));
		this.gameStage = 'preseason';

		return [
			{
				type: 'goToPreseason',
				teams: this.teams as PreseasonTeam[],
				history: this.history
			}
		];
	}

	// submitBRPick is called from handlePickBRFighter - simplified version
	private submitBRPick(teamIndex: number, fighter: number, equipment: number[]): void {
		this.fightersInBattle.push(
			new FighterInBattle(
				this.teams[teamIndex].fighters[fighter],
				equipment.map((e) => this.teams[teamIndex].equipment[e]),
				teamIndex
			)
		);
	}

	// submitFightPicks is called from handlePickFighters - simplified version
	private submitFightPicks(teamIndex: number, equipment: number[][]): void {
		for (let i = 0; i < this.teams[teamIndex].fighters.length; i++) {
			this.fightersInBattle.push(
				new FighterInBattle(
					this.teams[teamIndex].fighters[i],
					equipment[i].map((e) => this.teams[teamIndex].equipment[e]),
					teamIndex
				)
			);
		}
	}

	handleDisconnect(viewer: Viewer, wasHost: boolean): void {
		const indexControlledByViewer = getIndexByController(this.teams, viewer.index);
		const teamControlledByViewer = getTeamByController(this.teams, viewer.index);
		if (teamControlledByViewer !== null) {
			teamControlledByViewer.controller = 'bot';
			// Note: The room layer will handle broadcasting the leave event
			// TODO: Make the bot finish the player's turn if applicable
		}
		super.handleDisconnect(viewer, wasHost);
	}

	basicViewpointInfo(viewer: Viewer): ViewpointBase {
		return {
			...super.basicViewpointInfo(viewer),
			gameStage: this.gameStage,
			history: this.history,
			teams: this.teams
		};
	}

	viewpointOf(viewer: Viewer): MayhemManagerViewpoint {
		if (this.gameStage === 'preseason') {
			return {
				...this.basicViewpointInfo(viewer),
				gameStage: this.gameStage,
				teams: this.teams as PreseasonTeam[],
				ready: this.ready
			};
		} else if (this.gameStage === 'training') {
			return {
				...this.basicViewpointInfo(viewer),
				gameStage: this.gameStage,
				ready: this.ready
			};
		} else if (this.gameStage === 'draft' || this.gameStage === 'free agency') {
			return {
				...this.basicViewpointInfo(viewer),
				gameStage: this.gameStage,
				draftOrder: this.draftOrder,
				spotInDraftOrder: this.spotInDraftOrder,
				fighters: this.fighters
			};
		} else if (this.gameStage === 'battle royale') {
			return {
				...this.basicViewpointInfo(viewer),
				gameStage: this.gameStage,
				ready: this.ready,
				fightersInBattle: this.fightersInBattle
			};
		} else if (this.gameStage === 'tournament') {
			return {
				...this.basicViewpointInfo(viewer),
				gameStage: this.gameStage,
				bracket: this.bracket,
				ready: this.ready,
				fightersInBattle: this.fightersInBattle
			};
		}
	}

	private importLeague(league: MayhemManagerExport): void {
		clearTimeout(this.pickTimeout);
		this.teams = league.teams;
		this.ready = Array(this.teams.length).fill(false);
		this.gameStage = league.gameStage;

		if (league.gameStage === 'draft') {
			this.draftOrder = league.draftOrder;
			this.spotInDraftOrder = league.spotInDraftOrder;
			this.fighters = league.fighters;
			this.unsignedVeterans = league.unsignedVeterans;
		} else if (league.gameStage === 'free agency') {
			this.draftOrder = league.draftOrder;
			this.spotInDraftOrder = league.spotInDraftOrder;
			this.fighters = league.fighters;
		} else if (league.gameStage === 'training') {
			this.equipmentAvailable = league.equipmentAvailable;
		} else if (league.gameStage === 'tournament') {
			this.bracket = generateBracket(
				league.bracketOrdering.map((x) => {
					return { winner: x };
				})
			);
			this.nextMatch = nextMatch(this.bracket);
			this.prepareForNextMatch(); // Sets up ready array, no need for events
		}

		this.history = [];
		this.trainingChoices = this.teams.map((_) => {
			return { equipment: [], skills: [] };
		});
		this.fightersInBattle = [];
		// Note: Room layer will handle emitting full state to all viewers
	}

	private exportLeague(): MayhemManagerExport {
		const exportBase = {
			gameStage: this.gameStage,
			teams: this.teams,
			history: this.history
		};

		if (this.gameStage === 'preseason') {
			return {
				...exportBase,
				gameStage: 'preseason',
				teams: this.teams as PreseasonTeam[]
			};
		} else if (this.gameStage === 'draft') {
			return {
				...exportBase,
				gameStage: 'draft',
				draftOrder: this.draftOrder,
				spotInDraftOrder: this.spotInDraftOrder,
				fighters: this.fighters,
				unsignedVeterans: this.unsignedVeterans
			};
		} else if (this.gameStage === 'free agency') {
			return {
				...exportBase,
				gameStage: 'free agency',
				draftOrder: this.draftOrder,
				spotInDraftOrder: this.spotInDraftOrder,
				fighters: this.fighters
			};
		} else if (this.gameStage === 'training') {
			return {
				...exportBase,
				gameStage: 'training',
				equipmentAvailable: this.equipmentAvailable
			};
		} else if (this.gameStage === 'battle royale') {
			return {
				...exportBase,
				gameStage: 'battle royale'
			};
		} else if (this.gameStage === 'tournament') {
			return {
				...exportBase,
				gameStage: 'tournament',
				bracketOrdering: deconstructBracket(this.bracket)
			};
		}
	}
}

function generateBracket(components: Bracket[]): Bracket {
  // if there is only 1 team, return a bracket with just that one team
  if (components.length === 1) {
    return components[0];
  }
  // nearest power of 2 less than or equal to components.length
  const nearestPowerOf2 = Math.pow(2, Math.floor(Math.log2(components.length)));
  // if the number of component brackets is a power of 2, pair off the opposite seeds
  if (components.length === nearestPowerOf2) {
    const newComponents: Bracket[] = [];
    for (let i = 0; i < components.length / 2; i++) {
      newComponents.push({
        left: components[components.length - 1 - i],
        right: components[i],
        winner: null
      });
    }
    return generateBracket(newComponents);
  } else {
    // otherwise, pair off the brackets at the end to make it a power of 2
    const numByes = nearestPowerOf2 * 2 - components.length;
    const newComponents: Bracket[] = components.slice(0, numByes);
    for (let i = numByes; i < (components.length + numByes) / 2; i++) {
      newComponents.push({
        left: components[components.length + numByes - 1 - i],
        right: components[i],
        winner: null
      });
    }
    return generateBracket(newComponents);
  }
}

function deconstructBracket(bracket: Bracket): number[] {
  const arr = [bracket.winner as number];
  const nonLeafBracket = bracket as Bracket & { left: Bracket, right: Bracket };
  if (nonLeafBracket.left === undefined) {
    return arr;
  } else {
    const left = deconstructBracket(nonLeafBracket.left);
    const right = deconstructBracket(nonLeafBracket.right);
    for (let i = 0; i < left.length || i < right.length; i++) {
      if (i < left.length) {
        left.push(left[i]);
      }
      if (i < right.length) {
        right.push(right[i]);
      }
    }
  }
}

function levelInBracket(bracket: Bracket, teamName: string): number {
  if (bracket === undefined) {
    return 1;
  }
  if (bracket.winner === teamName) {
    return 0;
  }
  // @ts-ignore
  return 1 + Math.min(levelInBracket(bracket.left, teamName), levelInBracket(bracket.right, teamName));
}

function preserveBracket(bracket: Bracket, teams: Team[]): Bracket {
  // @ts-ignore
  if (bracket.left !== undefined) {
    return {
      winner: teams[bracket.winner].name,
      // @ts-ignore
      left: preserveBracket(bracket.left, teams),
      // @ts-ignore
      right: preserveBracket(bracket.right, teams)
    }
  }
  return {
    winner: teams[bracket.winner].name
  };
}

function generateTeamName(teams: Team[], randElement: <T>(array: T[]) => T): string {
  // generate a random name where neither part is already in use
  let nameStart = randElement(TEAM_NAME_STARTS);
  let nameEnd = randElement(TEAM_NAME_ENDS);
  while (teams.find(t => t.name.startsWith(nameStart)) !== undefined) {
    nameStart = randElement(TEAM_NAME_STARTS);
  }
  while (teams.find(t => t.name.endsWith(nameEnd)) !== undefined) {
    nameEnd = randElement(TEAM_NAME_ENDS);
  }
  return nameStart + " " + nameEnd;
}