import { GameType } from "$lib/types";
import type { PublicRoomState, Viewer } from "$lib/types";
import GameLogicHandlerBase from "$lib/backend/game-logic-handler-base";
import type GameRoom from "$lib/backend/game-room";
import { Side } from "$lib/auction-tic-tac-toe/types";
import type { AuctionTTTGameStatus, AuctionTTTViewpoint, Player, Settings } from "$lib/auction-tic-tac-toe/types";
import { number, object, string } from "yup";

const changeGameSettingsSchema = object({
  type: string().required().equals(["changeGameSettings"]),
  settings: object({
    startingMoney: number().required().integer().min(0),
    startingPlayer: string().required().oneOf(Object.values(Side))
  })
});

const joinSchema = object({
  type: string().required().equals(["join"]),
  side: string().required().oneOf([Side.X, Side.O])
});

const leaveSchema = object({
  type: string().required().equals(["leave"])
});

export default class AuctionTicTacToe extends GameLogicHandlerBase {
  settings: Settings
  gameType: GameType.AuctionTTT
  gameStatus: AuctionTTTGameStatus
  players: [Player, Player]
  whoseTurnToNominate?: Side
  whoseTurnToBid?: Side
  lastBid?: number
  squares?: Side[][]
  currentlyNominatedSquare?: [number, number]

  constructor(room: GameRoom) {
    super(room);
    this.settings = {
      startingMoney: 15,
      startingPlayer: Side.None
    };
    this.players = [{
      side: Side.X,
      money: 0
    }, {
      side: Side.O,
      money: 0
    }];
  }

  handleAction(viewer: Viewer, action?: any): void {
    if (this.room.host === viewer.index &&
        changeGameSettingsSchema.isValidSync(action)) {
      this.settings = action.settings as Settings;
      this.emitGamestateToAll();
    } else if (joinSchema.isValidSync(action) &&
        this.players.every((player) => player.controller !== viewer.index)) {
      this.players.forEach((player) => {
        if (player.side === action.side) {
          player.controller = viewer.index;
          this.emitGamestateToAll();
        }
      });
    } else if (leaveSchema.isValidSync(action) &&
        this.gameStatus === "pregame") {
      this.players.forEach((player) => {
        if (player.controller === viewer.index) {
          delete player.controller;
          this.emitGamestateToAll();
        }
      });
    } else {
      console.debug(action);
    }
  }

  handleDisconnect(viewer: Viewer, wasHost: boolean): void {
    this.players.forEach((player) => {
      if (player.controller === viewer.index) {
        delete player.controller;
        this.emitGamestateToAll();
      }
    });
    super.handleDisconnect(viewer, wasHost);
  }

  viewpointOf(viewer: Viewer): AuctionTTTViewpoint {
    if (this.gameStatus === "pregame") {
      return {
        ...this.basicViewpointInfo(viewer),
        gameType: GameType.AuctionTTT,
        gameStatus: this.gameStatus,
        settings: this.settings,
        players: this.players
      };
    } else if (this.gameStatus === "midgame") {
      return {
        ...this.basicViewpointInfo(viewer),
        gameType: GameType.AuctionTTT,
        gameStatus: this.gameStatus,
        settings: this.settings,
        players: this.players,
        whoseTurnToNominate: this.whoseTurnToNominate,
        whoseTurnToBid: this.whoseTurnToBid,
        lastBid: this.lastBid,
        squares: this.squares,
        currentlyNominatedSquare: this.currentlyNominatedSquare
      };
    } else if (this.gameStatus === "postgame") {
      return {
        ...this.basicViewpointInfo(viewer),
        gameType: GameType.AuctionTTT,
        gameStatus: this.gameStatus,
        settings: this.settings,
        players: this.players,
        squares: this.squares
      };
    }
  }

  publicRoomState(): PublicRoomState {
    return {
      gameType: GameType.AuctionTTT,
      gameStatus: "pregame",
      numPlayers: this.players.length
    };
  }
}
