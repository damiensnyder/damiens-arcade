import { GameType } from "$lib/types";
import type { Viewer } from "$lib/types";
import GameLogicHandlerBase from "$lib/backend/game-logic-handler-base";
import type GameRoom from "$lib/backend/game-room";
import type { TourneyGameStage, TourneyViewpoint, ViewpointBase, Team, Settings, Fighter, FighterStats, Bracket, FighterInBattle, Equipment, PreseasonTeam } from "$lib/tourney/types";
import { StatName } from "$lib/tourney/types";
import { array, mixed, number, object, string } from "yup";
import { getIndexByController, getTeamByController } from "$lib/tourney/utils";
import { settingsAreValid, addDefaultsIfApplicable, isValidEquipmentTournament, isValidEquipmentBR } from "$lib/tourney/battle-logic";
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

const practiceSchema = object({
  type: string().required().equals(["practice"]),
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
  equipment: array(number().integer().min(0)),
  strategy: array(strategySchema)
});

const resignSchema = object({
  type: string().required().equals(["pickBRFighter"]),
  fighter: number().integer().min(0)
});

const repairSchema = object({
  type: string().required().equals(["repair"]),
  equipment: number().integer().min(0)
});

export default class Tourney extends GameLogicHandlerBase {
  settings: Settings
  gameType: GameType.Tourney
  gameStage: TourneyGameStage
  teams?: (Team | PreseasonTeam)[]
  ready?: boolean[]
  draftOrder?: number[]
  spotInDraftOrder?: number
  fighters?: Fighter[]
  equipmentAvailable?: Equipment[][]
  fightersInBattle?: FighterInBattle[]
  map?: number
  bracket?: Bracket

  constructor(room: GameRoom) {
    super(room);
    this.settings = {};
  }

  handleAction(viewer: Viewer, action?: any): void {
    const indexControlledByViewer = getIndexByController(this.teams, viewer.index);
    const teamControlledByViewer = getTeamByController(this.teams, viewer.index);
    const isHost = this.room.host === viewer.index;

    // CHANGE GAME SETTINGS
    if (settingsAreValid(action) &&
        this.room.host === viewer.index) {
      this.settings = action.settings as Settings;
      this.emitEventToAll({
        type: "changeGameSettings",
        settings: action.settings as any
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
      this.spotInDraftOrder++;
      if (this.spotInDraftOrder == this.draftOrder.length) {
        setTimeout(this.advanceToTraining.bind(this), ADVANCEMENT_DELAY);
      }

      // PICK (training)
    } else if (pickSchema.isValidSync(action) &&
        indexControlledByViewer !== null &&
        this.gameStage === "training" &&
        action.index < this.equipmentAvailable.length &&
        teamControlledByViewer.money >= this.equipmentAvailable[indexControlledByViewer][action.index].price) {
      const equipmentPicked = this.equipmentAvailable[indexControlledByViewer].splice(action.index, 1)[0];
      teamControlledByViewer.equipment.push(equipmentPicked);
      teamControlledByViewer.money -= equipmentPicked.price;

      // PRACTICE
    } else if (practiceSchema.isValidSync(action) &&
        this.gameStage === "training" &&
        indexControlledByViewer !== null &&
        !this.ready[indexControlledByViewer] &&
        action.skills.length === teamControlledByViewer.fighters.length &&
        action.skills.every(skill => typeof StatName[skill] === "string" ||
                                     (typeof skill === "number" &&
                                      skill > 0 &&
                                      skill < teamControlledByViewer.equipment.length))) {
      action.skills.forEach((skill, i) => {
        if (typeof skill === "number") {
          teamControlledByViewer.fighters[i].attunements.push(
            teamControlledByViewer.equipment[skill].name
          );
        } else {
          teamControlledByViewer.fighters[i].abilities[skill]++;
        }
      });
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
        hp: teamControlledByViewer.fighters[action.fighter].stats.toughness * 5 + 25,
        maxHP: teamControlledByViewer.fighters[action.fighter].stats.toughness * 5 + 25,
        equipment: action.equipment.map((i) => teamControlledByViewer.equipment[i]),
        x: 0,
        y: 0
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
      // TODO: this isnt enough

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
      // console.debug("INVALID ACTION");
    }
  }

  startGame(): void {
    this.gameStage = "preseason";
    this.teams = [];
    addDefaultsIfApplicable(this.settings);
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
      randomIndex = Math.floor(Math.random() * currentIndex);
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
  }

  advanceToTraining(): void {
    this.gameStage = "training";
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
    this.gameStage = "battle royale";
    this.emitEventToAll({
      type: "goToBR",
      teams: this.teams
    });
    this.fightersInBattle = [];
    this.ready.fill(false);
  }

  simulateBattleRoyale(): void {

  }

  // generate a random fighter. in the future this generation should be more advanced
  generateFighter(): Fighter {
    const base = this.settings.fighters[
      Math.floor(this.settings.fighters.length * Math.random())
    ];
    return {
      imgUrl: "../favicon.ico",
      stats: {
        strength: Math.round(Math.random() * 10),
        accuracy: Math.round(Math.random() * 10),
        reflexes: Math.round(Math.random() * 10),
        energy: Math.round(Math.random() * 10),
        speed: Math.round(Math.random() * 10),
        toughness: Math.round(Math.random() * 10)
      },
      attunements: [],
      yearsLeft: 2,
      description: "",
      flavor: "",
      ...base
    };
  }

  // generate a random equipment. in the future this generation should be more advanced
  generateEquipment(): Equipment {
    const base = this.settings.equipment[
      Math.floor(this.settings.equipment.length * Math.random())
    ];
    return {
      imgUrl: "../favicon.ico",
      stats: {
        strength: 0,
        accuracy: 0,
        reflexes: 0,
        energy: 0,
        speed: 0,
        toughness: 0
      },
      durability: 3,
      price: 10,
      description: "",
      flavor: "",
      ...base
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
        gameStage: "preseason",
        teams: this.teams
      }
    } else if (this.gameStage === "draft" ||
        this.gameStage === "free agency") {
      return {
        ...this.basicViewpointInfo(viewer),
        gameStage: this.gameStage,
        teams: this.teams,
        draftOrder: this.draftOrder,
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