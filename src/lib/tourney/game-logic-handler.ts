import { GameType } from "$lib/types";
import type { Viewer } from "$lib/types";
import GameLogicHandlerBase from "$lib/backend/game-logic-handler-base";
import type GameRoom from "$lib/backend/game-room";
import type { TourneyGameStage, TourneyViewpoint, ViewpointBase, Team, Settings, Fighter, FighterStats, Bracket, FighterInBattle, Equipment, PreseasonTeam } from "$lib/tourney/types";
import { StatName } from "$lib/tourney/types";
import { array, mixed, number, object, string } from "yup";
import { getIndexByController, getTeamByController } from "$lib/tourney/utils";

const ADVANCEMENT_DELAY = 3000; // ms to wait before advancing to next stage automatically

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
  equipment: number().integer().min(0)
});

export default class Tourney extends GameLogicHandlerBase {
  settings: Settings
  gameType: GameType.Tourney
  gameStage: TourneyGameStage
  teams?: (Team | PreseasonTeam)[]
  draftOrder?: number[]
  spotInDraftOrder?: number
  fighters?: Fighter[]
  equipmentAvailable?: Equipment[][]
  fightersInBattle?: FighterInBattle[]
  map?: number
  bracket?: Bracket

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
        action.skills.length === teamControlledByViewer.fighters.length &&
        action.skills.every(skill => typeof StatName[skill] === "string" ||
                                     (typeof skill === "number" &&
                                      skill > 0 &&
                                      skill < teamControlledByViewer.equipment.length))) {
      action.skills.forEach((skill, i) => {
        if (typeof skill === "number") {
          teamControlledByViewer.fighters[i].attunements.push(skill);
        } else {
          teamControlledByViewer.fighters[i].abilities[skill]++;
        }
      });

      // PICK BR FIGHTER
    } else if (pickBRFighterSchema.isValidSync(action) &&
        this.gameStage === "battle royale") {

      // PICK FIGHTERS
    } else if (pickFightersSchema.isValidSync(action) &&
        this.gameStage === "tournament") {

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
    for (let i = 0; i < this.teams.length; i++) {
      const equipment: Equipment[] = [];
      for (let j = 0; j < 6; j++) {
        // this doesn't work at the moment because we have no equipment settings
        const equipmentIndex = Math.floor(Math.random() * this.settings.equipment.length);
        equipment.push(this.settings.equipment[equipmentIndex]);
      }
      this.equipmentAvailable.push([]);
    }
    this.emitEventToAll({
      type: "goToTraining",
      equipment: []
    });
  }

  // generate a random fighter. in the future this generation should be more advanced
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
      attunements: [],
      abilities: [],
      yearsLeft: 2
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