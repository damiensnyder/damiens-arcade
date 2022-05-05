import { GameType } from "$lib/types";
import type { Viewer } from "$lib/types";
import GameLogicHandlerBase from "$lib/backend/game-logic-handler-base";
import type GameRoom from "$lib/backend/game-room";
import type { TourneyGameStage, TourneyViewpoint, ViewpointBase, Team, Settings, Fighter, FighterStats } from "$lib/tourney/types";
import { array, boolean, mixed, number, object, string } from "yup";
import { getIndexByController, getTeamByController } from "$lib/tourney/utils";

const changeGameSettingsSchema = object({
  type: string().required().equals(["changeGameSettings"]),
  settings: object({
    stages: string(),
    fighters: string(),
    equipment: string()
  })
});

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
  type: string().required().equals(["draft"]),
  index: number().integer().min(0)
});

const practiceSchema = object({
  type: string().required().equals(["practice"]),
  skills: array(mixed())
});

const strategySchema = object({});

const pickBRFighterSchema = object({
  type: string().required().equals(["pickBRFighter"]),
  fighter: number().integer().min(0),
  equipment: number().integer().min(0),
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
  fighter: number().integer().min(0)
});

export default class Tourney extends GameLogicHandlerBase {
  settings: Settings
  gameType: GameType.Tourney
  gameStage: TourneyGameStage
  teams?: Team[]
  draftOrder?: number[]
  fighters?: Fighter[]
  tourneyResults?: number[]

  constructor(room: GameRoom) {
    super(room);
    this.settings = {
      stages: [],
      fighters: [],
      equipment: []
    };
  }

  handleAction(viewer: Viewer, action?: any): void {
    const indexControlledByViewer = getIndexByController(this.teams, viewer.index);
    const teamControlledByViewer = getTeamByController(this.teams, viewer.index);
    const isHost = this.room.host === viewer.index;

    // CHANGE GAME SETTINGS
    if (changeGameSettingsSchema.isValidSync(action) &&
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
        this.gameStage !== "pregame" &&
        isHost) {
      if (this.gameStage === "preseason") {
        this.advanceToDraft();
      }
    } else {
      console.debug("INVALID ACTION");
    }
  }

  startGame(): void {
    this.gameStage = "preseason";
    this.teams = [];
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

  generateFighter(): Fighter {
    return {
      name: "John",
      imgUrl: "",
      stats: {
        strength: Math.round(Math.random() * 10),
        accuracy: Math.round(Math.random() * 10),
        reflexes: Math.round(Math.random() * 10),
        energy: Math.round(Math.random() * 10),
        speed: Math.round(Math.random() * 10),
        toughness: Math.round(Math.random() * 10)
      },
      abilities: [],
      yearsLeft: 2
    }
  }

  handleDisconnect(viewer: Viewer, wasHost: boolean): void {
    const indexControlledByViewer = getIndexByController(this.teams, viewer.index);
    const teamControlledByViewer = getTeamByController(this.teams, viewer.index);
    if (teamControlledByViewer !== null) {
      teamControlledByViewer.controller = "bot";
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
    } else if (this.gameStage === "preseason") {
      return {
        ...this.basicViewpointInfo(viewer),
        gameStage: "preseason",
        teams: this.teams
      }
    } else if (this.gameStage === "draft") {
      return {
        ...this.basicViewpointInfo(viewer),
        gameStage: "draft",
        teams: this.teams,
        draftOrder: this.draftOrder,
        fighters: this.fighters
      }
    } else {
      return {
        ...this.basicViewpointInfo(viewer),
        gameStage: this.gameStage as "preseason",
        teams: this.teams
      }
    }
  }
}