import { GameType } from "$lib/types";
import type { Viewer } from "$lib/types";
import GameLogicHandlerBase from "$lib/backend/game-logic-handler-base";
import type GameRoom from "$lib/backend/game-room";
import type { TourneyGameStage, TourneyViewpoint, Team, Settings } from "$lib/tourney/types";
import { array, boolean, number, object, string } from "yup";
import { getIndexByController, getTeamByController } from "$lib/tourney/utils";

const changeGameSettingsSchema = object({
  type: string().required().equals(["changeGameSettings"]),
  settings: object({
    stages: string(),
    fighters: string(),
    equipment: string()
  })
});

const joinSchema = object({
  type: string().required().equals(["join"])
});

const leaveSchema = object({
  type: string().required().equals(["leave"])
});

const startGameSchema = object({
  type: string().required().equals(["start"])
});

export default class Tourney extends GameLogicHandlerBase {
  settings: Settings
  gameType: GameType.Tourney
  gameStage: TourneyGameStage
  teams: Team[]
  draftOrder?: number[]

  constructor(room: GameRoom) {
    super(room);
    this.settings = {
      stages: [],
      fighters: [],
      equipment: []
    };
    this.teams = [];
  }
  handleAction(viewer: Viewer, action?: any): void {
    const indexControlledByViewer = getIndexByController(this.teams, viewer.index);
    const teamControlledByViewer = getTeamByController(this.teams, viewer.index);
    const isHost = this.room.host === viewer.index;

    // JOIN
    if (joinSchema.isValidSync(action) &&
        teamControlledByViewer === null &&
        this.teams.length < 16) {
      this.teams.push({
        controller: viewer.index,
        money: 0,
        fighters: [],
        equipment: []
      });
      this.emitEventToAll({
        type: "join",
        controller: viewer.index
      });

      // LEAVE
    } else if (leaveSchema.isValidSync(action) &&
        this.gameStage === "pregame" &&
        teamControlledByViewer !== null) {
      teamControlledByViewer.controller = "bot";
      this.emitEventToAll({
        type: "leave",
        team: indexControlledByViewer
      });
    } else if (changeGameSettingsSchema.isValidSync(action) &&
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
    } else {
      console.debug("INVALID ACTION");
    }
  }

  startGame(): void {
    this.gameStage = "draft";
    for (const team of this.teams) {
      team.money = 100;
    }

    // shuffle the draft order to start
    this.draftOrder = [];
    for (let i = 0; i < this.teams.length; i++) {
      this.draftOrder.push(i);
    }
    let currentIndex = this.draftOrder.length;
    let randomIndex;
    while (currentIndex != 0) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      [this.draftOrder[currentIndex], this.draftOrder[randomIndex]] =
          [this.draftOrder[randomIndex], this.draftOrder[currentIndex]];
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

  viewpointOf(viewer: Viewer): TourneyViewpoint {
    return {
      ...this.basicViewpointInfo(viewer),
      gameType: GameType.Tourney,
      gameStage: this.gameStage as "pregame",
      settings: this.settings,
      teams: this.teams
    };
  }
}