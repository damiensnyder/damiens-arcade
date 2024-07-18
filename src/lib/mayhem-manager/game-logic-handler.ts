import type { Viewer } from "$lib/types";
import GameLogicHandlerBase from "$lib/backend/game-logic-handler-base";
import type GameRoom from "$lib/backend/game-room";
import type { MayhemManagerGameStage, MayhemManagerViewpoint, ViewpointBase, Team, Fighter, Bracket, Equipment, PreseasonTeam, EquipmentTemplate, FighterTemplate, MayhemManagerExport, Appearance, Color } from "$lib/mayhem-manager/types";
import { StatName } from "$lib/mayhem-manager/types";
import { fighterValue, getIndexByController, getTeamByController, nextMatch } from "$lib/mayhem-manager/utils";
import { SHIRT_COLORS, SHORTS_COLORS, generateFighters, generateEightEquipment } from "$lib/mayhem-manager/decks";
import { isValidEquipmentTournament, isValidEquipmentFighter, Fight, FighterInBattle } from "$lib/mayhem-manager/battle-logic";
import Bot from "$lib/mayhem-manager/bot";
import { addBotSchema, advanceSchema, exportLeagueSchema, importSchema, joinSchema, leaveSchema, passSchema, pickBRFighterSchema, pickFightersSchema, pickSchema, practiceSchema, readySchema, removeSchema, repairSchema, replaceSchema, resignSchema } from "./schemata";



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

export default class MayhemManager extends GameLogicHandlerBase {
  declare gameStage: MayhemManagerGameStage
  teams?: (Team | PreseasonTeam)[]
  ready?: boolean[]
  draftOrder?: number[]
  spotInDraftOrder?: number
  fighters?: Fighter[]
  unsignedVeterans?: Fighter[]
  equipmentAvailable?: Equipment[][]
  trainingChoices?: { equipment: number[], skills: (number | StatName)[] }[]
  fightersInBattle?: FighterInBattle[]
  map?: number
  bracket?: Bracket
  nextMatch?: Bracket & { left: Bracket, right: Bracket }
  history: Bracket[]
  pickTimeout?: NodeJS.Timeout

  constructor(room: GameRoom) {
    super(room);
    this.gameStage = "preseason";
    this.teams = [];
    this.history = [];
    this.ready = [];
  }

  handleAction(viewer: Viewer, action?: any): void {
    // writeFileSync("logs/lastGame.json", JSON.stringify(this.exportLeague()));

    const indexControlledByViewer = getIndexByController(this.teams, viewer.index);
    const teamControlledByViewer = getTeamByController(this.teams, viewer.index);
    const isHost = this.room.host === viewer.index;
    
    if (action === "debug") {
      const temp = this.room;
      delete this.room;  // so we don't have to look at all the parameters of the socket
      console.debug(this);
      this.room = temp;
      
      // JOIN
    } else if (joinSchema.safeParse(action).success &&
        this.gameStage === "preseason" &&
        teamControlledByViewer === null &&
        this.teams.length < 16 &&
        !this.teams.some(t => t.name === action.name)) {
      this.addTeam(viewer.index, action.name);

      // LEAVE
    } else if (leaveSchema.safeParse(action).success &&
        teamControlledByViewer !== null) {
      teamControlledByViewer.controller = "bot";
      this.ready[indexControlledByViewer] = false;
      this.emitEventToAll({
        type: "leave",
        team: indexControlledByViewer
      });

      // REPLACE
    } else if (replaceSchema.safeParse(action).success &&
        teamControlledByViewer === null &&
        action.team < this.teams.length &&
        this.teams[action.team].controller === "bot") {
      this.teams[action.team].controller = viewer.index;
      this.emitEventToAll({
        type: "replace",
        team: action.team,
        controller: viewer.index
      });

      if (this.gameStage === "training") {
        this.emitEventTo(viewer, {
          type: "goToTraining",
          equipment: this.equipmentAvailable[action.team]
        });
      }

      // REMOVE
    } else if (removeSchema.safeParse(action).success &&
        this.gameStage === "preseason" &&
        isHost &&
        action.team < this.teams.length) {
      this.teams.splice(action.team, 1);
      this.ready.splice(action.team, 1);
      this.emitEventToAll({
        type: "remove",
        team: action.team
      });

      // READY
    } else if (readySchema.safeParse(action).success &&
        this.gameStage === "preseason" &&
        indexControlledByViewer !== null) {
      // mark player as ready, and if all non-bot players are ready (assuming 2+ teams), go to draft
      this.ready[indexControlledByViewer] = true;
      this.emitEventToAll({
        type: "ready",
        team: indexControlledByViewer
      });
      if (this.teams.every((team: PreseasonTeam, i: number) => this.ready[i] || team.controller === "bot") && this.teams.length >= 2) {
        this.advanceToDraft();
      }

      // ADD BOT
    } else if (addBotSchema.safeParse(action).success &&
        this.gameStage === "preseason" &&
        this.teams.length < 16 &&
        isHost) {
      this.addTeam("bot", generateTeamName(this.teams, this.randElement.bind(this)));

      // ADVANCE
    } else if (advanceSchema.safeParse(action).success &&
        isHost) {
      this.advance();
      
      // PICK (draft)
    } else if (pickSchema.safeParse(action).success &&
        indexControlledByViewer !== null &&
        this.gameStage === "draft") {
      this.pickFighter(indexControlledByViewer, action.index);
      if (this.spotInDraftOrder === this.draftOrder.length ||
          this.teams[this.draftOrder[this.spotInDraftOrder]].controller === "bot") {
        this.advance();
      }

      // PICK (free agency)
    } else if (pickSchema.safeParse(action).success &&
        indexControlledByViewer !== null &&
        this.gameStage === "free agency") {
      this.pickFighter(indexControlledByViewer, action.index);

      // PASS
    } else if (passSchema.safeParse(action).success &&
        indexControlledByViewer !== null &&
        this.gameStage === "free agency") {
      this.emitEventToAll(action);
      this.spotInDraftOrder++;
      if (this.spotInDraftOrder === this.draftOrder.length ||
          this.teams[this.draftOrder[this.spotInDraftOrder]].controller === "bot") {
        this.advance();
      }

      // PRACTICE
    } else if (practiceSchema.safeParse(action).success &&
        this.gameStage === "training" &&
        indexControlledByViewer !== null &&
        !this.ready[indexControlledByViewer] &&
        action.skills.length === teamControlledByViewer.fighters.length) {
      this.trainingChoices[indexControlledByViewer] = {
        equipment: action.equipment,
        skills: action.skills
      };
      this.ready[indexControlledByViewer] = true;
      this.emitEventToAll({
        type: "ready",
        team: indexControlledByViewer
      });
      // if the only players not ready or bots, make them pick and ready
      if (this.teams.every((t, i) => this.ready[i] || t.controller === "bot")) {
        this.teams.forEach((t, i) => {
          if (t.controller === "bot" && !this.ready[i]) {
            this.ready[i] = true;
            this.trainingChoices[i] = Bot.getTrainingPicks(t, this.equipmentAvailable[i]);
          }
        });
        this.advanceToBattleRoyale();
      }

      // PICK BR FIGHTER
    } else if (pickBRFighterSchema.safeParse(action).success &&
        this.gameStage === "battle royale" &&
        indexControlledByViewer !== null) {
      this.submitBRPick(indexControlledByViewer, action.fighter, action.equipment);

      // PICK FIGHTERS
    } else if (pickFightersSchema.safeParse(action).success &&
        this.gameStage === "tournament" &&
        indexControlledByViewer !== null) {
      this.submitFightPicks(indexControlledByViewer, action.equipment);

      // RESIGN
    } else if (resignSchema.safeParse(action).success &&
        this.gameStage === "preseason" &&
        indexControlledByViewer !== null) {
      this.resignFighter(indexControlledByViewer, action.fighter);

      // REPAIR
    } else if (repairSchema.safeParse(action).success &&
        this.gameStage === "preseason" &&
        indexControlledByViewer !== null) {
      this.repairEquipment(indexControlledByViewer, action.equipment);
    } else if (importSchema.safeParse(action).success) {
      // validations needed for some invariants zod misses, e.g.
      // that draft order is not longer than array of fighters
      this.importLeague(action);
    } else if (exportLeagueSchema.safeParse(action).success) {
      this.emitEventTo(viewer, {
        type: "exportLeague",
        league: this.exportLeague()
      });
    } else {
      console.log(action);
    }
  }

  advance(): void {
    clearTimeout(this.pickTimeout);
    // advance does a different thing depending on what stage you are in
    if (this.gameStage === "preseason" &&
        this.teams.length >= 1) {
      this.advanceToDraft();
    } else if (this.gameStage === "draft") {
      if (this.spotInDraftOrder === this.draftOrder.length) {
        // we're done, go straight to FA (no timeout)
        this.advanceToFreeAgency();
      } else {
        const pickingTeam = this.teams[this.draftOrder[this.spotInDraftOrder]];
        if (pickingTeam.controller === "bot") {
          // if bot's turn when pressed, do bots automatically
          this.doBotDraftPick();
        } else {
          // if human's turn when pressed, have bot pick for them, then do all the bots after them automatically
          // or advance to FA if no one else left
          const pick = Bot.getDraftPick(pickingTeam, this.fighters);
          this.pickFighter(this.draftOrder[this.spotInDraftOrder], pick);
          // don't advance in draft order b/c that already happens when picking fighter in draft
          if (this.spotInDraftOrder === this.draftOrder.length) {
            this.advanceToFreeAgency();
          } else {
            this.pickTimeout = setTimeout(this.doBotDraftPick.bind(this), BOT_DELAY);
          }
        }
      }
    } else if (this.gameStage === "free agency") {
      if (this.spotInDraftOrder === this.draftOrder.length) {
        // we're done, go straight to training (no timeout)
        this.advanceToTraining();
      } else {
        const pickingTeam = this.teams[this.draftOrder[this.spotInDraftOrder]];
        if (pickingTeam.controller === "bot") {
          // if bot's turn when pressed, do bots automatically
          this.doBotFAPick();
        } else {
          // if human's turn when pressed, make them pass, then do all the bots after them automatically
          // or advance to training if no one else left
          this.emitEventToAll({
            type: "pass"
          });
          this.spotInDraftOrder++;
          if (this.spotInDraftOrder === this.draftOrder.length) {
            this.advanceToTraining();
          } else {
            this.pickTimeout = setTimeout(this.doBotFAPick.bind(this), BOT_DELAY);
          }
        }
      }
    } else if (this.gameStage === "training") {
      for (let i = 0; i < this.teams.length; i++) {
        if (!this.ready[i]) {
          const trainingPicks = Bot.getTrainingPicks(this.teams[i], this.equipmentAvailable[i]);
          this.trainingChoices[i] = {
            equipment: trainingPicks.equipment,
            skills: trainingPicks.skills
          };
        }
      }
      this.advanceToBattleRoyale();
    } else if (this.gameStage === "battle royale") {
      // get bot picks from unready players then simulate battle royale
      for (let i = 0; i < this.teams.length; i++) {
        if (!this.ready[i]) {
          const brPicks = Bot.getBRPicks(this.teams[i]);
          this.submitBRPick(i, brPicks.fighter, brPicks.equipment, false);
        }
      }
      this.simulateBattleRoyale();
    } else if (this.gameStage === "tournament") {
      // if the tournament is over, advance to preseason
      if (this.bracket.winner !== null) {
        this.advanceToPreseason();
      } else {
        // otherwise, simulate the next fight
        // need to get bot picks from unready players first
        for (let i = 0; i < this.teams.length; i++) {
          if (!this.ready[i]) {
            const fightPicks = Bot.getFightPicks(this.teams[i]);
            this.submitFightPicks(i, fightPicks, false);
          }
        }
        this.simulateFight();
      }
    }
  }

  advanceToDraft(): void {
    this.gameStage = "draft";

    // get picks from bot teams
    this.teams.forEach((team: PreseasonTeam, i) => {
      if (team.controller === "bot") {
        const picks = Bot.getPreseasonPicks(team);
        picks.fighters.forEach((f, j) => {
          // subtract j because each fighter resigned shifts later fighters to the left
          this.resignFighter(i, f - j);
        });
        picks.equipment.forEach((e, j) => {
          this.repairEquipment(i, e - j);
        });
      }
    });

    this.unsignedVeterans = [];
    this.teams.forEach((team: PreseasonTeam) => {
      this.unsignedVeterans = this.unsignedVeterans.concat(team.needsResigning);
    });

    // draft order is reverse order of results of previous tourney
    this.draftOrder = [];
    for (let i = 0; i < this.teams.length; i++) {
      this.draftOrder.push(i);
    }
    const lastBracket = this.history.length > 0 ? this.history[this.history.length - 1] : undefined;
    this.draftOrder.sort((a, b) => {
      return levelInBracket(lastBracket, this.teams[b].name) - levelInBracket(lastBracket, this.teams[a].name);
    })
    this.spotInDraftOrder = 0;

    // generate n + 4 random fighters to draft, where n is the number of teams
    this.fighters = generateFighters(this.teams.length + 4, false, this);
    this.fighters.sort((a, b) => fighterValue(b) - fighterValue(a));

    this.emitEventToAll({
      type: "goToDraft",
      draftOrder: this.draftOrder,
      fighters: this.fighters
    });

    clearTimeout(this.pickTimeout);
    this.pickTimeout = setTimeout(this.doBotDraftPick.bind(this), BOT_DELAY);
  }

  doBotDraftPick(): void {
    clearTimeout(this.pickTimeout);

    // if (this.gameStage !== "draft" || this.spotInDraftOrder >= this.draftOrder.length) return;
    // if you advance too fast w/o the above line, the next line crashes, despite clearTimeout
    const pickingTeam = this.teams[this.draftOrder[this.spotInDraftOrder]];
    if (pickingTeam.controller !== "bot") return;
    const pick = Bot.getDraftPick(pickingTeam, this.fighters);
    this.pickFighter(this.draftOrder[this.spotInDraftOrder], pick);
    if (this.spotInDraftOrder === this.draftOrder.length) {
      this.pickTimeout = setTimeout(this.advanceToFreeAgency.bind(this), BOT_DELAY);
    } else {
      this.pickTimeout = setTimeout(this.doBotDraftPick.bind(this), BOT_DELAY);
    }
  }

  advanceToFreeAgency(): void {
    clearTimeout(this.pickTimeout);

    this.gameStage = "free agency";
    this.draftOrder.reverse(); // free agency has reverse pick order from the draft
    this.spotInDraftOrder = 0;

    // free agents are undrafted fighters and unsigned veterans, padded with random new ones if
    // there aren't enough
    this.fighters = this.unsignedVeterans.concat(this.fighters);
    this.fighters = this.fighters.concat(generateFighters(this.teams.length + 4 - this.fighters.length, false, this));
    this.fighters.sort((a, b) => fighterValue(b) - fighterValue(a));

    // set price based on how good the fighter is and how old they are
    for (const fighter of this.fighters) {
      fighter.price = Math.floor(1.35 * fighterValue(fighter) + this.randInt(-5, 5));
    }

    this.emitEventToAll({ type: "goToFA", fighters: this.fighters });
    this.pickTimeout = setTimeout(this.doBotFAPick.bind(this), BOT_DELAY);
  }

  doBotFAPick(): void {
    clearTimeout(this.pickTimeout);

    // if (this.gameStage !== "free agency" || this.spotInDraftOrder >= this.draftOrder.length) return;
    // if you advance too fast w/o the above line, the next line crashes, despite clearTimeout
    const pickingTeam = this.teams[this.draftOrder[this.spotInDraftOrder]];
    if (pickingTeam.controller !== "bot") return;
    const picks = Bot.getFAPicks(pickingTeam, this.fighters);
    for (const pick of picks) {
      this.pickFighter(this.draftOrder[this.spotInDraftOrder], pick);
    }
    this.emitEventToAll({
      type: "pass"
    });
    this.spotInDraftOrder++;
    if (this.spotInDraftOrder === this.draftOrder.length) {
      this.pickTimeout = setTimeout(this.advanceToTraining.bind(this), BOT_DELAY);
    } else {
      this.pickTimeout = setTimeout(this.doBotFAPick.bind(this), BOT_DELAY);
    }
  }

  advanceToTraining(): void {
    clearTimeout(this.pickTimeout);

    this.gameStage = "training";
    delete this.fighters;
    delete this.draftOrder;
    delete this.spotInDraftOrder;

    this.trainingChoices = Array(8);
    this.equipmentAvailable = [];
    this.ready = Array(this.teams.length).fill(false);
    for (let i = 0; i < this.teams.length; i++) {
      const equipment = generateEightEquipment(this)
      this.equipmentAvailable.push(equipment);
    }
    for (const viewer of this.room.viewers) {
      const teamIndex = getIndexByController(this.teams, viewer.index);
      if (teamIndex === null) {
        this.emitEventTo(viewer, {
          type: "goToTraining"
        });
      } else {
        this.emitEventTo(viewer, {
          type: "goToTraining",
          equipment: this.equipmentAvailable[teamIndex]
        });
      }
    }
  }

  advanceToBattleRoyale(): void {
    let i = 0;
    for (const team of this.teams) {
      for (const fighter of team.fighters) {
        fighter.oldStats = { ...fighter.stats };
        fighter.appearance.shirtColor = SHIRT_COLORS[i % 6];
        fighter.appearance.shortsColor = SHORTS_COLORS[i % 5];
      }
      i++;
    }
    this.trainingChoices.forEach((choice, i) => {
      const team = this.teams[i]
      const e = this.equipmentAvailable[i];
      choice.equipment.forEach((equipmentIndex) => {
        if (equipmentIndex >= 0 &&
            equipmentIndex < e.length &&
            team.money >= e[equipmentIndex].price) {
          const equipmentPicked = e.splice(equipmentIndex, 1)[0];
          team.equipment.push(equipmentPicked);
          team.money = Math.round(team.money - equipmentPicked.price);
          equipmentPicked.price = 0;
        }
      });
      choice.skills.forEach((skill, j) => {
        if (typeof skill === "number" && skill >= 0 && skill < team.equipment.length) {
          team.fighters[j].attunements.push(team.equipment[skill].name);
        } else if (typeof skill === "string" &&
            Object.values(StatName).includes(skill) &&
            team.fighters[j].stats[skill] < 10) {
          team.fighters[j].stats[skill] += 1;
        }
        this.doAgeBasedDevelopment(team.fighters[j]);
      });
    });
    delete this.trainingChoices;
    delete this.equipmentAvailable;

    this.gameStage = "battle royale";
    this.emitEventToAll({
      type: "goToBR",
      teams: this.teams
    });
    this.fightersInBattle = [];
    this.ready.fill(false);
    for (const team of this.teams) {
      for (const fighter of team.fighters) {
        delete fighter.oldStats;
      }
    }
  }

  doAgeBasedDevelopment(f: Fighter) {
    for (const stat in f.stats) {
      if (this.randReal() < 0.5) {
        let change = 2/3 * (this.randReal() + this.randReal() + this.randReal() - 1.5);
        // amplify positive changes for players in first two years and all changes for players over 35
        if (f.experience <= 2 || f.experience >= 12) {
          change *= 2;
        }
        // buff younger fighters, debuff older ones
        change += (3 - f.experience) / 12;
        f.stats[stat] = Math.min(Math.max(f.stats[stat] + Math.round(change), 0), 10);
      }
    }
  }

  simulateBattleRoyale(): void {
    const fight = new Fight(this, this.fightersInBattle);
    fight.simulate();
    this.emitEventToAll({
      type: "fight",
      eventLog: fight.eventLog
    });
    this.bracket = generateBracket(fight.placementOrder.map((team) => {
      return { winner: team };
    }));
    this.gameStage = "tournament";
    this.prepareForNextMatch();
  }

  simulateFight(): void {
    const fight = new Fight(this, this.fightersInBattle);
    fight.simulate();
    this.emitEventToAll({
      type: "fight",
      eventLog: fight.eventLog
    });
    this.nextMatch.winner = fight.placementOrder[0];
    this.prepareForNextMatch();
  }

  prepareForNextMatch(): void {
    delete this.map;
    this.fightersInBattle = [];
    this.emitEventToAll({
      type: "bracket",
      bracket: this.bracket
    });
    if (this.bracket.winner !== null) {
      delete this.nextMatch;
      return;
    }
    this.nextMatch = nextMatch(this.bracket);
    this.ready = Array(this.teams.length).fill(true);
    this.ready[this.nextMatch.left.winner] = false;
    this.ready[this.nextMatch.right.winner] = false;
  }

  advanceToPreseason(): void {
    this.teams.forEach((team: PreseasonTeam) => {
      // add 1 to experience (for fighters) and years owned (for equipment)
      // fighters need to be re-signed every 3 years, starting after their 2nd
      // equipment needs to be repaired every 2 years, starting after the 1st
      // fighter price is based on their skill, whereas repair price is
      // solely dependent on years owned
      team.needsResigning = team.fighters.filter((fighter) => {
        fighter.experience++;
        if ((fighter.experience % 2) === 1) {
          fighter.price = fighterValue(fighter) + this.randInt(-5, 5);
          return true;
        }
        return false;
      });
      team.fighters = team.fighters.filter((fighter) => (fighter.experience % 2 !== 1));
      team.needsRepair = team.equipment.filter((equipment) => {
        equipment.yearsOwned++;
        if ((equipment.yearsOwned % 2) === 0) {
          equipment.price = 3 * equipment.yearsOwned + this.randInt(1, 7);
          return true;
        }
        return false;
      });
      team.equipment = team.equipment.filter((equipment) => (equipment.yearsOwned % 2) !== 0);
      team.money = Math.ceil(team.money / 2 + 100);
    });
    this.ready = Array(this.teams.length).fill(false);
    delete this.fightersInBattle;
    delete this.map;
    
    // add the last season's bracket to the league's history
    this.history.push(preserveBracket(this.bracket, this.teams));

    this.gameStage = "preseason";
    this.emitEventToAll({
      type: "goToPreseason",
      teams: this.teams as PreseasonTeam[],
      history: this.history
    });
  }

  addTeam(viewerIndex: number | "bot", name: string): void {
    this.teams.push({
      controller: viewerIndex,
      name: name,
      money: 100,
      fighters: [],
      equipment: [],
      needsResigning: [],
      needsRepair: []
    });
    this.ready.push(false);
    this.emitEventToAll({
      type: "join",
      controller: viewerIndex,
      name
    });
  }

  pickFighter(teamIndex: number, fighterIndex: number): void {
    if (fighterIndex < this.fighters.length &&
        this.draftOrder[this.spotInDraftOrder] === teamIndex &&
        this.teams[teamIndex].money >= this.fighters[fighterIndex].price) {
      const fighterPicked = this.fighters.splice(fighterIndex, 1)[0];
      this.teams[teamIndex].fighters.push(fighterPicked);
      this.teams[teamIndex].money = Math.round(this.teams[teamIndex].money - fighterPicked.price);
      this.emitEventToAll({
        type: "pick",
        fighter: fighterIndex
      });
      if (this.gameStage === "draft") {
        this.spotInDraftOrder++;
      }
    }
  }

  resignFighter(teamIndex: number, fighterIndex: number): void {
    const team: PreseasonTeam = this.teams[teamIndex] as PreseasonTeam;
    if (fighterIndex < team.needsResigning.length &&
        team.money >= team.needsResigning[fighterIndex].price) {
      const fighterResigned = team.needsResigning.splice(fighterIndex, 1)[0];
      team.fighters.push(fighterResigned);
      team.money = Math.round(team.money - fighterResigned.price);
      fighterResigned.price = 0;
      this.emitEventToAll({
        type: "resign",
        team: teamIndex,
        fighter: fighterIndex
      });
    }
  }

  repairEquipment(teamIndex: number, equipmentIndex: number): void {
    const team: PreseasonTeam = this.teams[teamIndex] as PreseasonTeam;
    if (equipmentIndex < team.needsRepair.length &&
        team.money >= team.needsRepair[equipmentIndex].price) {
      const equipmentRepaired = team.needsRepair.splice(equipmentIndex, 1)[0];
      team.money = Math.round(team.money - equipmentRepaired.price);
      equipmentRepaired.price = 0;
      team.equipment.push(equipmentRepaired);
      this.emitEventToAll({
        type: "repair",
        team: teamIndex,
        equipment: equipmentIndex
      });
    }
  }

  submitBRPick(teamIndex: number, fighter: number, equipment: number[], doUnreadyBots: boolean = true) {
    if (!this.ready[teamIndex] &&
        fighter < this.teams[teamIndex].fighters.length &&
        isValidEquipmentFighter(this.teams[teamIndex], equipment)) {
      this.fightersInBattle.push(
        new FighterInBattle(
          this.teams[teamIndex].fighters[fighter],
          equipment.map(e => this.teams[teamIndex].equipment[e]),
          teamIndex
        )
      );
      this.ready[teamIndex] = true;
      this.emitEventToAll({
        type: "ready",
        team: teamIndex
      });

      // if the only players not still ready are bots, make them pick and ready
      if (doUnreadyBots &&
          this.teams.every((t, i) => t.controller === "bot" || this.ready[i])) {
        this.teams.forEach((t, i) => {
          if (t.controller === "bot" && !this.ready[i]) {
            const picks = Bot.getBRPicks(t);
            this.ready[i] = true;
            this.fightersInBattle.push(
              new FighterInBattle(
                this.teams[i].fighters[picks.fighter],
                picks.equipment.map(e => this.teams[i].equipment[e]),
                i
              )
            );
          }
        });
        this.simulateBattleRoyale();
      }
    }
  }

  submitFightPicks(teamIndex: number, equipment: number[][], doUnreadyBots: boolean = true): void {
    if (!this.ready[teamIndex] &&
        isValidEquipmentTournament(this.teams[teamIndex], equipment)) {
      this.ready[teamIndex] = true;
      this.emitEventToAll({
        type: "ready",
        team: teamIndex
      });
      for (let i = 0; i < this.teams[teamIndex].fighters.length; i++) {
        this.fightersInBattle.push(
          new FighterInBattle(
            this.teams[teamIndex].fighters[i],
            equipment[i].map((e) => this.teams[teamIndex].equipment[e]),
            i
          )
        );
      }

      // if the only players not still ready are bots, make them pick and ready
      if (doUnreadyBots &&
          this.teams.every((t, i) => t.controller === "bot" || this.ready[i])) {
        this.teams.forEach((t, i) => {
          if (t.controller === "bot" && !this.ready[i]) {
            const picks = Bot.getFightPicks(t);
            this.ready[i] = true;
            for (let j = 0; j < t.fighters.length; j++) {
              this.fightersInBattle.push(
                new FighterInBattle(
                  this.teams[i].fighters[j],
                  picks[j].map((e) => this.teams[i].equipment[e]),
                  i
                )
              );
            }
          }
        });
        this.simulateFight();
      }
    }
  }

  handleDisconnect(viewer: Viewer, wasHost: boolean): void {
    const indexControlledByViewer = getIndexByController(this.teams, viewer.index);
    const teamControlledByViewer = getTeamByController(this.teams, viewer.index);
    if (teamControlledByViewer !== null) {
      teamControlledByViewer.controller = "bot";
      // in the future we will also want to make the bot finish the player's turn, if applicable
      this.emitEventToAll({
        type: "leave",
        team: indexControlledByViewer
      });
    }
    super.handleDisconnect(viewer, wasHost);
  }

  basicViewpointInfo(viewer: Viewer): ViewpointBase {
    return {
      ...super.basicViewpointInfo(viewer),
      gameStage: this.gameStage,
      history: this.history,
      teams: this.teams
    }
  }

  viewpointOf(viewer: Viewer): MayhemManagerViewpoint {
    if (this.gameStage === "preseason") {
      return {
        ...this.basicViewpointInfo(viewer),
        gameStage: this.gameStage,
        teams: this.teams as PreseasonTeam[],
        ready: this.ready
      };
    } else if (this.gameStage === "training") {
      return {
        ...this.basicViewpointInfo(viewer),
        gameStage: this.gameStage,
        ready: this.ready
      };
    } else if (this.gameStage === "draft" ||
        this.gameStage === "free agency") {
      return {
        ...this.basicViewpointInfo(viewer),
        gameStage: this.gameStage,
        draftOrder: this.draftOrder,
        spotInDraftOrder: this.spotInDraftOrder,
        fighters: this.fighters
      };
    } else if (this.gameStage === "battle royale") {
      return {
        ...this.basicViewpointInfo(viewer),
        gameStage: this.gameStage,
        ready: this.ready,
        fightersInBattle: this.fightersInBattle
      };
    } else if (this.gameStage === "tournament") {
      return {
        ...this.basicViewpointInfo(viewer),
        gameStage: this.gameStage,
        bracket: this.bracket,
        ready: this.ready,
        fightersInBattle: this.fightersInBattle
      };
    }
  }

  importLeague(league: MayhemManagerExport): void {
    clearTimeout(this.pickTimeout);
    this.teams = league.teams;
    this.ready = Array(this.teams.length).fill(false);
    this.gameStage = league.gameStage;
    if (league.gameStage === "draft") {
      this.draftOrder = league.draftOrder;
      this.spotInDraftOrder = league.spotInDraftOrder;
      this.fighters = league.fighters;
      this.unsignedVeterans = league.unsignedVeterans;
    } else if (league.gameStage === "free agency") {
      this.draftOrder = league.draftOrder;
      this.spotInDraftOrder = league.spotInDraftOrder;
      this.fighters = league.fighters;
    } else if (league.gameStage === "training") {
      this.equipmentAvailable = league.equipmentAvailable;
    } else if (league.gameStage === "tournament") {
      this.bracket = generateBracket(league.bracketOrdering.map(x => {
        return {
          winner: x
        }
      }));
      this.nextMatch = nextMatch(this.bracket);
      this.prepareForNextMatch();
    }
    this.history = []
    this.trainingChoices = this.teams.map((_) => { return { equipment: [], skills: [] } });
    this.fightersInBattle = [];
    this.emitGamestateToAll();
  }

  exportLeague(): MayhemManagerExport {
    let exportBase = {
      gameStage: this.gameStage,
      teams: this.teams,
      history: this.history,
    }
    if (this.gameStage === "preseason") {
      return {
        ...exportBase,
        gameStage: "preseason",
        teams: this.teams as PreseasonTeam[]
      }
    } else if (this.gameStage === "draft") {
      return {
        ...exportBase,
        gameStage: "draft",
        draftOrder: this.draftOrder,
        spotInDraftOrder: this.spotInDraftOrder,
        fighters: this.fighters,
        unsignedVeterans: this.unsignedVeterans,
      }
    } else if (this.gameStage === "free agency") {
      return {
        ...exportBase,
        gameStage: "free agency",
        draftOrder: this.draftOrder,
        spotInDraftOrder: this.spotInDraftOrder,
        fighters: this.fighters
      }
    } else if (this.gameStage === "training") {
      return {
        ...exportBase,
        gameStage: "training",
        equipmentAvailable: this.equipmentAvailable
      }
    } else if (this.gameStage === "battle royale") {
      return {
        ...exportBase,
        gameStage: "battle royale"
      }
    } else if (this.gameStage === "tournament") {
      return {
        ...exportBase,
        gameStage: "tournament",
        bracketOrdering: deconstructBracket(this.bracket)
      }
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