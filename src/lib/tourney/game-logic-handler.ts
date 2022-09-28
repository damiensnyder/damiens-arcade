import type { Viewer } from "$lib/types";
import GameLogicHandlerBase from "$lib/backend/game-logic-handler-base";
import type GameRoom from "$lib/backend/game-room";
import type { TourneyGameStage, TourneyViewpoint, ViewpointBase, Team, Settings, Fighter, Bracket, FighterInBattle, Equipment, PreseasonTeam, Map, MapDeck, EquipmentDeck, FighterDeck } from "$lib/tourney/types";
import { StatName } from "$lib/tourney/types";
import { array, mixed, number, object, string } from "yup";
import { getIndexByController, getTeamByController, nextMatch } from "$lib/tourney/utils";
import { settingsAreValid, collatedSettings, isValidEquipmentTournament, isValidEquipmentBR, simulateFight, TICK_LENGTH } from "$lib/tourney/battle-logic";
import Bot from "$lib/tourney/bot";

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
  "Futuristic",
  "Lovely",
  "Healthy",
  "Motivated",
  "Nefarious",
  "Meticulous"
];
const TEAM_NAME_ENDS = [
  "Bashers",
  "Megalodons",
  "Birds",
  "Pterodactyls",
  "Marigolds",
  "Whirlwinds",
  "Apricots",
  "Yaks",
  "Electricians",
  "Monocles",
  "Manatees",
  "Bakers",
  "Wallabies",
  "Cats",
  "Swashbucklers",
  "Locksmiths",
  "Pickles",
  "Pandas",
  "Melonheads",
  "Wombats"
];

const startGameSchema = object({
  type: string().required().equals(["start"])
});

const joinSchema = object({
  type: string().required().equals(["join"])
});

const leaveSchema = object({
  type: string().required().equals(["leave"])
});

const replaceSchema = object({
  type: string().required().equals(["replace"]),
  team: number().integer().required().min(0)
});

const removeSchema = object({
  type: string().required().equals(["remove"]),
  team: number().integer().required().min(0)
});

const addBotSchema = object({
  type: string().required().equals(["addBot"])
});

const advanceSchema = object({
  type: string().required().equals(["advance"])
});

const pickSchema = object({
  type: string().required().equals(["pick"]),
  index: number().integer().min(0)
});

const passSchema = object({
  type: string().required().equals(["pass"])
});

const practiceSchema = object({
  type: string().required().equals(["practice"]),
  equipment: array(number().min(0)).required(),
  skills: array(mixed())
});

const strategySchema = object({});

const pickBRFighterSchema = object({
  type: string().required().equals(["pickBRFighter"]),
  fighter: number().integer().min(0).required(),
  equipment: array(number().integer().min(0)).required(),
  strategy: strategySchema
});

const pickFightersSchema = object({
  type: string().required().equals(["pickFighters"]),
  equipment: array(array(number().integer().min(0))).required(),
  strategy: array(strategySchema)
});

const resignSchema = object({
  type: string().required().equals(["resign"]),
  fighter: number().integer().min(0)
});

const repairSchema = object({
  type: string().required().equals(["repair"]),
  equipment: number().integer().min(0)
});

export default class Tourney extends GameLogicHandlerBase {
  settings: Settings
  decks?: {
    fighters: FighterDeck,
    equipment: EquipmentDeck,
    maps: MapDeck
  }
  declare gameStage: TourneyGameStage
  teams?: (Team | PreseasonTeam)[]
  ready?: boolean[]
  draftOrder?: number[]
  spotInDraftOrder?: number
  fighters?: Fighter[]
  equipmentAvailable?: Equipment[][]
  trainingChoices?: { equipment: number[], skills: (number | StatName)[] }[]
  fightersInBattle?: FighterInBattle[]
  map?: number
  bracket?: Bracket
  nextMatch?: Bracket & { left: Bracket, right: Bracket }

  constructor(room: GameRoom) {
    super(room);
    this.settings = {
      fighterDecks: ["default"],
      equipmentDecks: ["default"],
      mapDecks: ["default"],
      customFighters: [],
      customEquipment: [],
      customMaps: []
    };
  }

  handleAction(viewer: Viewer, action?: any): void {
    const indexControlledByViewer = getIndexByController(this.teams, viewer.index);
    const teamControlledByViewer = getTeamByController(this.teams, viewer.index);
    const isHost = this.room.host === viewer.index;
    
    if (action === "debug") {
      const temp = this.room;
      delete this.room;  // so we don't have to look at all the parameters of the socket
      console.debug(this);
      this.room = temp;

    // CHANGE GAME SETTINGS
    } else if (settingsAreValid(action) &&
        this.room.host === viewer.index) {
      this.settings = action.settings;
      this.emitEventToAll({
        type: "changeGameSettings",
        settings: this.settings
      });

      // START
    } else if (startGameSchema.isValidSync(action) &&
        this.gameStage === "pregame" &&
        isHost) {
      this.startGame();
      this.emitEventToAll({
        type: "start"
      });

      // JOIN
    } else if (joinSchema.isValidSync(action) &&
        this.gameStage === "preseason" &&
        teamControlledByViewer === null &&
        this.teams.length < 16) {
      this.addTeam(viewer.index);

      // LEAVE
    } else if (leaveSchema.isValidSync(action) &&
        teamControlledByViewer !== null) {
      teamControlledByViewer.controller = "bot";
      this.emitEventToAll({
        type: "leave",
        team: indexControlledByViewer
      });

      // REPLACE
    } else if (replaceSchema.isValidSync(action) &&
        this.gameStage !== "pregame" &&
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
    } else if (removeSchema.isValidSync(action) &&
        this.gameStage === "preseason" &&
        isHost &&
        action.team < this.teams.length) {
      this.teams.splice(action.team, 1);
      this.emitEventToAll({
        type: "remove",
        team: action.team
      });

      // ADD BOT
    } else if (addBotSchema.isValidSync(action) &&
        this.gameStage === "preseason" &&
        isHost) {
      this.addTeam("bot");

      // ADVANCE
    } else if (advanceSchema.isValidSync(action) &&
        isHost) {
      // advance does a different thing depending on what stage you are in
      if (this.gameStage === "preseason" &&
          this.teams.length >= 1) {
        this.advanceToDraft();
      } else if (this.gameStage === "draft") {
        let firstIteration = true;
        while (this.spotInDraftOrder < this.teams.length) {
          const pickingTeam = this.teams[this.draftOrder[this.spotInDraftOrder]];
          // stop auto-drafting if the next team up is not bot-controlled
          // but if it's the first iteration we assume the advancement is desired
          if (!firstIteration && pickingTeam.controller !== "bot") {
            break;
          }
          const pick = Bot.getDraftPick(pickingTeam, this.fighters);
          this.pickFighter(this.draftOrder[this.spotInDraftOrder], pick);
          firstIteration = false;
        }
        if (this.spotInDraftOrder === this.draftOrder.length) {
          this.advanceToFreeAgency();
        }
      } else if (this.gameStage === "free agency") {
        let firstIteration = true;
        while (this.spotInDraftOrder < this.teams.length) {
          const pickingTeam = this.teams[this.draftOrder[this.spotInDraftOrder]];
          // stop auto-drafting if the next team up is not bot-controlled
          // but if it's the first iteration we assume the advancement is desired
          if (!firstIteration && pickingTeam.controller !== "bot") {
            break;
          }
          const picks = Bot.getFAPicks(pickingTeam, this.fighters);
          for (const pick of picks) {
            this.pickFighter(this.spotInDraftOrder, pick);
          }
          this.emitEventToAll({
            type: "pass"
          });
          firstIteration = false;
          this.spotInDraftOrder++;
        }
        if (this.spotInDraftOrder === this.draftOrder.length) {
          this.advanceToTraining();
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
        for (let i = 0; i < this.teams.length; i++) {
          if (!this.ready[i]) {
            const brPicks = Bot.getBRPicks(this.teams[i]);
            this.submitBRPick(i, brPicks.fighter, brPicks.equipment);
          }
        }
      } else if (this.gameStage === "tournament") {
        // if the tournament is over, advance to preseason
        if (this.bracket.winner !== null) {
          this.advanceToPreseason();
        } else {
          // otherwise, simulate the next fight
          for (let i = 0; i < this.teams.length; i++) {
            if (!this.ready[i]) {
              const fightPicks = Bot.getFightPicks(this.teams[i]);
              this.submitFightPicks(i, fightPicks.equipment);
            }
          }
        }
      }
      
      // PICK (draft)
    } else if (pickSchema.isValidSync(action) &&
        indexControlledByViewer !== null &&
        this.gameStage === "draft") {
      this.pickFighter(indexControlledByViewer, action.index);
      if (this.spotInDraftOrder === this.draftOrder.length) {
        this.advanceToFreeAgency();
      }

      // PICK (free agency)
    } else if (pickSchema.isValidSync(action) &&
        indexControlledByViewer !== null &&
        this.gameStage === "free agency") {
      this.pickFighter(indexControlledByViewer, action.index);

      // PASS
    } else if (passSchema.isValidSync(action) &&
        indexControlledByViewer !== null &&
        this.gameStage === "free agency") {
      this.emitEventToAll(action);
      this.spotInDraftOrder++;
      if (this.spotInDraftOrder === this.draftOrder.length) {
        this.advanceToTraining();
      }

      // PRACTICE
    } else if (practiceSchema.isValidSync(action) &&
        this.gameStage === "training" &&
        indexControlledByViewer !== null &&
        !this.ready[indexControlledByViewer] &&
        action.skills.length === teamControlledByViewer.fighters.length) {
      this.trainingChoices[indexControlledByViewer] = {
        equipment: action.equipment,
        skills: action.skills
      };
      this.ready[indexControlledByViewer] = true;
      if (this.ready.every(x => x)) {
        this.advanceToBattleRoyale();
      }

      // PICK BR FIGHTER
    } else if (pickBRFighterSchema.isValidSync(action) &&
        this.gameStage === "battle royale" &&
        indexControlledByViewer !== null) {
      this.submitBRPick(indexControlledByViewer, action.fighter, action.equipment);

      // PICK FIGHTERS
    } else if (pickFightersSchema.isValidSync(action) &&
        this.gameStage === "tournament" &&
        indexControlledByViewer !== null) {
      this.submitFightPicks(indexControlledByViewer, action.equipment);

      // RESIGN
    } else if (resignSchema.isValidSync(action) &&
        this.gameStage === "preseason" &&
        indexControlledByViewer !== null) {
      this.resignFighter(indexControlledByViewer, action.fighter);

      // REPAIR
    } else if (repairSchema.isValidSync(action) &&
        this.gameStage === "preseason" &&
        indexControlledByViewer !== null) {
      this.repairEquipment(indexControlledByViewer, action.equipment);
    }
  }

  startGame(): void {
    this.gameStage = "preseason";
    this.teams = [];
    this.decks = collatedSettings(this.settings);
  }

  advanceToDraft(): void {
    this.gameStage = "draft";

    // shuffle the draft order to start
    // in the future this should go in reverse order of results of previous tourney
    this.draftOrder = [];
    for (let i = 0; i < this.teams.length; i++) {
      this.draftOrder.push(i);
    }
    let currentIndex = this.draftOrder.length;
    let randomIndex: number;
    while (currentIndex != 0) {
      randomIndex = this.randInt(0, currentIndex - 1);
      currentIndex--;
      [this.draftOrder[currentIndex], this.draftOrder[randomIndex]] =
          [this.draftOrder[randomIndex], this.draftOrder[currentIndex]];
    }
    this.spotInDraftOrder = 0;

    // generate n + 4 random fighters to draft, where n is the number of teams
    this.fighters = [];
    for (let i = 0; i < this.teams.length + 4; i++) {
      this.fighters.push(this.generateFighter());
    }

    this.emitEventToAll({
      type: "goToDraft",
      draftOrder: this.draftOrder,
      fighters: this.fighters
    });
  }

  advanceToFreeAgency(): void {
    this.gameStage = "free agency";
    this.draftOrder.reverse(); // free agency has reverse pick order from the draft
    this.spotInDraftOrder = 0;

    // for now we are generating random fighters, but in the future they should be fighters who
    // have already been generated but their contracts ran out or they weren't picked
    while (this.fighters.length < this.teams.length + 4) {
      this.fighters.push(this.generateFighter());
    }

    // in the future, fighters should have prices based on how good they are
    for (const fighter of this.fighters) {
      fighter.price = 20;
    }

    this.emitEventToAll({ type: "goToFA", fighters: this.fighters });
  }

  advanceToTraining(): void {
    this.gameStage = "training";
    delete this.fighters;
    delete this.draftOrder;
    delete this.spotInDraftOrder;

    this.trainingChoices = Array(8);
    this.equipmentAvailable = [];
    this.ready = [];
    for (let i = 0; i < this.teams.length; i++) {
      const equipment: Equipment[] = [];
      for (let j = 0; j < 8; j++) {
        equipment.push(this.generateEquipment());
      }
      this.equipmentAvailable.push(equipment);
      this.ready.push(false);
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
    this.trainingChoices.forEach((choice, i) => {
      const team = this.teams[i]
      const e = this.equipmentAvailable[i];
      choice.equipment.forEach((equipmentIndex) => {
        if (equipmentIndex >= 0 &&
            equipmentIndex < e.length &&
            team.money >= e[equipmentIndex].price) {
          const equipmentPicked = e.splice(equipmentIndex, 1)[0];
          team.equipment.push(equipmentPicked);
          team.money -= equipmentPicked.price;
          equipmentPicked.price = 0;
        }
      });
      choice.skills.forEach((skill, j) => {
        if (typeof skill === "number" && skill >= 0 && team.equipment.length < skill) {
          team.fighters[j].attunements.push(team.equipment[skill].name);
        } else if (typeof skill === "string" &&
            Object.values(StatName).includes(skill) &&
            team.fighters[j].stats[skill] < 10) {
          team.fighters[j].stats[skill] += 1;
        }
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
  }

  simulateBattleRoyale(): void {
    const seeding = simulateFight(
      this.emitEventToAll.bind(this),
      this.randElement(this.decks.maps.maps),
      {
        randInt: this.randInt.bind(this),
        randReal: this.randReal.bind(this),
        randElement: this.randElement.bind(this)
      },
      this.fightersInBattle
    );
    this.bracket = generateBracket(seeding.map(team => {
      return { winner: team };
    }));
    this.gameStage = "tournament";
    this.prepareForNextMatch();
  }

  simulateFight(): void {
    this.nextMatch.winner = simulateFight(
      this.emitEventToAll.bind(this),
      this.randElement(this.decks.maps.maps),
      {
        randInt: this.randInt.bind(this),
        randReal: this.randReal.bind(this),
        randElement: this.randElement.bind(this)
      },
      this.fightersInBattle
    )[0];
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
    this.ready[this.nextMatch.left.winner] = false;
    this.ready[this.nextMatch.right.winner] = false;
  }

  advanceToPreseason(): void {
    this.teams.forEach((team: PreseasonTeam) => {
      // add 1 to experience (for fighters) and years owned (for equipment)
      // fighters need to be re-signed every 3 years, starting after their 2nd
      // equipment needs to be repaired every 2 years, starting after the 1st
      // fighter price is based on their skill (not yet implemented), whereas repair price is
      // solely dependent on years owned
      team.needsResigning = team.fighters.filter((fighter) => {
        fighter.experience++;
        if ((fighter.experience % 3) === 2) {
          fighter.price = 20;
          return true;
        }
        return false;
      });
      team.fighters = team.fighters.filter((fighter) => (fighter.experience % 3 !== 2));
      team.needsRepair = team.equipment.filter((equipment) => {
        equipment.yearsOwned++;
        if ((equipment.yearsOwned % 2) === 1) {
          equipment.price = 2 * equipment.yearsOwned;
          return true;
        }
        return false;
      });
      team.equipment = team.equipment.filter((equipment) => (equipment.yearsOwned % 2) !== 1);
      team.money = Math.ceil(team.money / 2) + 100;
    });
    this.gameStage = "preseason";
    delete this.fightersInBattle;
    delete this.map;
    this.emitEventToAll({
      type: "goToPreseason",
      teams: this.teams as PreseasonTeam[]
    });
  }

  addTeam(viewerIndex: number | "bot"): void {
    if (this.teams.length < 16) {
      this.teams.push({
        controller: viewerIndex,
        name: this.randElement(TEAM_NAME_STARTS) + " " + this.randElement(TEAM_NAME_ENDS),
        money: 100,
        fighters: [],
        equipment: [],
        needsResigning: [],
        needsRepair: []
      });
      this.emitEventToAll({
        type: "join",
        controller: viewerIndex,
        name: this.teams[this.teams.length - 1].name
      });
    }
  }

  pickFighter(teamIndex: number, fighterIndex: number): void {
    if (fighterIndex < this.fighters.length &&
        this.draftOrder[this.spotInDraftOrder] === teamIndex &&
        this.teams[teamIndex].money >= this.fighters[fighterIndex].price) {
      const fighterPicked = this.fighters.splice(fighterIndex, 1)[0];
      this.teams[teamIndex].fighters.push(fighterPicked);
      this.teams[teamIndex].money -= fighterPicked.price;
      fighterPicked.experience = this.gameStage === "draft" ? 0 : 2;
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
    console.debug(teamIndex, fighterIndex);
    const team: PreseasonTeam = this.teams[teamIndex] as PreseasonTeam;
    console.debug(team.needsResigning.length);
    console.debug(team.money, team.needsResigning[fighterIndex].price);
    if (fighterIndex < team.needsResigning.length &&
        team.money >= team.needsResigning[fighterIndex].price) {
      const fighterResigned = team.needsResigning.splice(fighterIndex, 1)[0];
      team.money -= fighterResigned.price;
      fighterResigned.price = 0;
      team.fighters.push(fighterResigned);
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
      team.money -= equipmentRepaired.price;
      equipmentRepaired.price = 0;
      team.equipment.push(equipmentRepaired);
      this.emitEventToAll({
        type: "repair",
        team: teamIndex,
        equipment: equipmentIndex
      });
    }
  }

  submitBRPick(teamIndex: number, fighter: number, equipment: number[]) {
    if (!this.ready[teamIndex] &&
        fighter < this.teams[teamIndex].fighters.length &&
        isValidEquipmentBR(this.teams[teamIndex], equipment)) {
      this.fightersInBattle.push({
        ...this.teams[teamIndex].fighters[fighter],
        team: teamIndex,
        hp: 100,
        maxHP: 100,
        equipment: equipment.map((e) => this.teams[teamIndex].equipment[e]),
        x: 0,
        y: 0,
        cooldown: 0
      });
      this.ready[teamIndex] = true;
      if (this.ready.every(x => x)) {
        this.simulateBattleRoyale();
      }
    }
  }

  submitFightPicks(teamIndex: number, equipment: number[][]): void {
    if (!this.ready[teamIndex] &&
        isValidEquipmentTournament(this.teams[teamIndex], equipment)) {
      this.ready[teamIndex] = true;
      for (let i = 0; i < this.teams[teamIndex].fighters.length; i++) {
        this.fightersInBattle.push({
          ...this.teams[teamIndex].fighters[i],
          team: teamIndex,
          hp: 100,
          maxHP: 100,
          equipment: equipment[i].map((e) => this.teams[teamIndex].equipment[e]),
          x: 0,
          y: 0,
          cooldown: 0
        });
      }
      if (this.ready.every(x => x)) {
        this.simulateFight();
        this.prepareForNextMatch();
      }
    }
  }

  // Generate a random fighter
  generateFighter(): Fighter {
    const gender = ["M", "F", "A"][this.randInt(0, 2)];

    // in the future, first/last names and abilities should not cross over between decks.
    // but thats such a minor deal. i do not care.
    const fighter: Fighter = {
      name: this.randElement(this.decks.fighters["firstNames" + gender]) + " " +
          this.randElement(this.decks.fighters.lastNames),
      gender,
      price: 0,
      abilities: [],
      stats: {
        strength: this.randInt(0, 10),
        accuracy: this.randInt(0, 10),
        reflexes: this.randInt(0, 10),
        energy: this.randInt(0, 10),
        speed: this.randInt(0, 10),
        toughness: this.randInt(0, 10)
      },
      attunements: [],
      experience: 0,
      description: "",
      flavor: ""
    }
    // 60% of the time, give them an ability. set to 0 right now
    if (this.randReal() < 0 /* 0.6 */) {
      const specialTemplate = this.randElement(this.decks.fighters.abilities);
      return {
        ...fighter,
        ...specialTemplate
      }
    }
    return fighter;
  }

  // Select a random equipment from the deck of equipment
  generateEquipment(): Equipment {
    return {
      description: "",
      flavor: "",
      yearsOwned: 0,
      ...this.randElement(this.decks.equipment.equipment),
    };
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
      settings: this.settings
    }
  }

  viewpointOf(viewer: Viewer): TourneyViewpoint {
    if (this.gameStage === "pregame") {
      this.basicViewpointInfo(viewer);
    } else if (this.gameStage === "preseason" ||
        this.gameStage === "training") {
      return {
        ...this.basicViewpointInfo(viewer),
        gameStage: this.gameStage,
        teams: this.teams
      }
    } else if (this.gameStage === "draft" ||
        this.gameStage === "free agency") {
      return {
        ...this.basicViewpointInfo(viewer),
        gameStage: this.gameStage,
        teams: this.teams,
        draftOrder: this.draftOrder,
        spotInDraftOrder: this.spotInDraftOrder,
        fighters: this.fighters
      }
    } else if (this.gameStage === "battle royale") {
      return {
        ...this.basicViewpointInfo(viewer),
        gameStage: this.gameStage,
        teams: this.teams,
        fightersInBattle: this.fightersInBattle,
        map: this.map
      }
    } else if (this.gameStage === "tournament") {
      return {
        ...this.basicViewpointInfo(viewer),
        gameStage: this.gameStage,
        teams: this.teams,
        bracket: this.bracket,
        fightersInBattle: this.fightersInBattle,
        map: this.map
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
        left: components[i],
        right: components[components.length - 1 - i],
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
        left: components[i],
        right: components[components.length + numByes - 1 - i],
        winner: null
      });
    }
    return generateBracket(newComponents);
  }
}