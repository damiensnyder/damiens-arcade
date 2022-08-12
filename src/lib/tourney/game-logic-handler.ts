import { GameType } from "$lib/types";
import type { Viewer } from "$lib/types";
import GameLogicHandlerBase from "$lib/backend/game-logic-handler-base";
import type GameRoom from "$lib/backend/game-room";
import type { TourneyGameStage, TourneyViewpoint, ViewpointBase, Team, Settings, Fighter, Bracket, FighterInBattle, Equipment, PreseasonTeam, Map, MapDeck, EquipmentDeck, FighterDeck } from "$lib/tourney/types";
import { StatName } from "$lib/tourney/types";
import { array, mixed, number, object, string } from "yup";
import { getIndexByController, getTeamByController } from "$lib/tourney/utils";
import { settingsAreValid, collatedSettings, isValidEquipmentTournament, isValidEquipmentBR, simulateFight } from "$lib/tourney/battle-logic";

// ms to wait before advancing to next stage automatically
// 0 in dev mode, 3000 in production
const ADVANCEMENT_DELAY = 0; 

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
  gameType: GameType.Tourney
  gameStage: TourneyGameStage
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
      this.teams.push({
        controller: viewer.index,
        name: `Team ${this.teams.length + 1}`,
        money: 100,
        fighters: [],
        equipment: []
      });
      this.emitEventToAll({
        type: "join",
        controller: viewer.index,
        name: this.teams[this.teams.length - 1].name
      });

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
        isHost &&
        this.teams.length < 16) {
      this.teams.push({
        controller: "bot",
        name: `Team ${this.teams.length + 1}`,
        money: 100,
        fighters: [],
        equipment: []
      });
      this.emitEventToAll({
        type: "join",
        controller: "bot",
        name: this.teams[this.teams.length - 1].name
      });

      // ADVANCE
    } else if (advanceSchema.isValidSync(action) &&
        this.gameStage === "preseason" &&
        isHost &&
        this.teams.length >= 1) {
      this.advanceToDraft();
      
      // PICK (draft)
    } else if (pickSchema.isValidSync(action) &&
        indexControlledByViewer !== null &&
        this.gameStage === "draft" &&
        action.index < this.fighters.length &&
        this.draftOrder[this.spotInDraftOrder] === indexControlledByViewer) {
      const fighterPicked = this.fighters.splice(action.index, 1)[0];
      teamControlledByViewer.fighters.push(fighterPicked);
      fighterPicked.yearsLeft = 2;
      this.emitEventToAll(action);
      this.spotInDraftOrder++;
      if (this.spotInDraftOrder == this.draftOrder.length) {
        setTimeout(this.advanceToFreeAgency.bind(this), ADVANCEMENT_DELAY);
      }

      // PICK (free agency)
    } else if (pickSchema.isValidSync(action) &&
        indexControlledByViewer !== null &&
        this.gameStage === "free agency" &&
        action.index < this.fighters.length &&
        this.draftOrder[this.spotInDraftOrder] === indexControlledByViewer &&
        teamControlledByViewer.money >= this.fighters[action.index].price) {
      const fighterPicked = this.fighters.splice(action.index, 1)[0];
      teamControlledByViewer.fighters.push(fighterPicked);
      teamControlledByViewer.money -= fighterPicked.price;
      fighterPicked.yearsLeft = 2;
      this.emitEventToAll(action);

      // PASS
    } else if (passSchema.isValidSync(action) &&
        indexControlledByViewer !== null &&
        this.gameStage === "free agency") {
      this.emitEventToAll(action);
      this.spotInDraftOrder++;
      if (this.spotInDraftOrder === this.draftOrder.length) {
        setTimeout(this.advanceToTraining.bind(this), ADVANCEMENT_DELAY);
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
        indexControlledByViewer !== null &&
        !this.ready[indexControlledByViewer] &&
        action.fighter < teamControlledByViewer.fighters.length &&
        isValidEquipmentBR(teamControlledByViewer, action.equipment)) {
      this.ready[indexControlledByViewer] = true;
      this.fightersInBattle.push({
        ...teamControlledByViewer.fighters[action.fighter],
        team: indexControlledByViewer,
        hp: 100,
        maxHP: 100,
        equipment: action.equipment.map((e) => teamControlledByViewer.equipment[e]),
        x: 0,
        y: 0,
        cooldown: 0
      });
      if (this.ready.every(x => x)) {
        this.simulateBattleRoyale();
      }

      // PICK FIGHTERS
    } else if (pickFightersSchema.isValidSync(action) &&
        this.gameStage === "tournament" &&
        indexControlledByViewer !== null &&
        !this.ready[indexControlledByViewer] &&
        isValidEquipmentTournament(teamControlledByViewer, action.equipment)) {
      this.ready[indexControlledByViewer] = true;
      for (let i = 0; i < teamControlledByViewer.fighters.length; i++) {
        this.fightersInBattle.push({
          ...teamControlledByViewer.fighters[i],
          team: indexControlledByViewer,
          hp: 100,
          maxHP: 100,
          equipment: action.equipment[i].map((e) => teamControlledByViewer.equipment[e]),
          x: 0,
          y: 0,
          cooldown: 0
        });
      }
      if (this.ready.every(x => x)) {
        this.simulateFight();
      }

      // RESIGN
    } else if (resignSchema.isValidSync(action) &&
        this.gameStage === "preseason" &&
        indexControlledByViewer !== null &&
        action.fighter < (teamControlledByViewer as PreseasonTeam).needsResigning.length &&
        (teamControlledByViewer as PreseasonTeam).needsResigning[action.fighter].price < teamControlledByViewer.money) {
      teamControlledByViewer.money -= (teamControlledByViewer as PreseasonTeam).needsResigning[action.fighter].price;
      teamControlledByViewer.fighters.push((teamControlledByViewer as PreseasonTeam).needsResigning[action.fighter]);

      // REPAIR
    } else if (repairSchema.isValidSync(action) &&
        this.gameStage === "preseason" &&
        indexControlledByViewer !== null &&
        action.equipment < (teamControlledByViewer as PreseasonTeam).needsRepair.length &&
        (teamControlledByViewer as PreseasonTeam).needsRepair[action.equipment].price < teamControlledByViewer.money) {
      teamControlledByViewer.money -= (teamControlledByViewer as PreseasonTeam).needsRepair[action.equipment].price;
      teamControlledByViewer.equipment.push((teamControlledByViewer as PreseasonTeam).needsRepair[action.equipment]);
    } else {
      // if (typeof action === "object" && action != null && action.type === "pass") {
      //   console.debug("INVALID ACTION:");
      //   console.debug(action);
      //   console.log(indexControlledByViewer);
      //   console.log(this.gameStage)
      // }
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
            e[equipmentIndex].price <= team.money) {
          const equipmentPicked = e.splice(equipmentIndex, 1)[0];
          team.equipment.push(equipmentPicked);
          team.money -= equipmentPicked.price;
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
    // just say everything goes in order
    // in the future this should... actually, you know, simulate the battle royale
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
    this.bracket = generateBracket(seeding);
    this.gameStage = "tournament";
    this.emitEventToAll({
      type: "bracket",
      bracket: this.bracket
    });
    setTimeout(this.prepareForNextMatch.bind(this), ADVANCEMENT_DELAY);
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
    this.prepareForNextMatch();
  }

  prepareForNextMatch(): void {
    delete this.fightersInBattle;
    delete this.map;
    delete this.nextMatch;
    if (this.bracket.winner !== null) {
      this.advanceToPreseason();
    }
    const matchesToCheck: Bracket[] = [this.bracket];
    while (matchesToCheck.length > 0) {
      const match = matchesToCheck.splice(0, 1)[0];
      if (match.winner === null) {
        // @ts-ignore
        this.nextMatch = match;
        matchesToCheck.push(this.nextMatch.right);
        matchesToCheck.push(this.nextMatch.left);
      }
    }
    this.ready[this.nextMatch.left.winner] = false;
    this.ready[this.nextMatch.right.winner] = false;
  }

  advanceToPreseason(): void {
    this.teams.forEach((team: PreseasonTeam) => {
      team.needsResigning = team.fighters.filter((fighter) => {
        fighter.yearsLeft === 0;
      });
      team.fighters = team.fighters.filter((fighter) => {
        fighter.yearsLeft > 0;
      });
      team.needsRepair = team.equipment.filter((equipment) => {
        equipment.durability === 0;
      });
      team.equipment = team.equipment.filter((equipment) => {
        equipment.durability > 0;
      });
      team.money = Math.ceil(team.money / 2) + 100;
    });
    this.gameStage = "preseason";
    delete this.fightersInBattle;
    delete this.map;
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
      yearsLeft: 2,
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
      durability: 3,
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
      gameType: GameType.Tourney,
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

function generateBracket(seeding: number[]): Bracket {
  if (seeding.length === 1) {
    return {
      winner: seeding[0]
    }
  }
  const powerOf2Below = Math.pow(2, Math.floor(Math.log2(seeding.length - 1)));
  return {
    left: generateBracket(seeding.slice(0, powerOf2Below)),
    right: generateBracket(seeding.slice(powerOf2Below)),
    winner: null
  };
}