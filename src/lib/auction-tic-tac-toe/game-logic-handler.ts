import { GameStatus, GameType, Viewer } from "$lib/types";
import GameLogicHandlerBase from "../backend/game-logic-handler-base";
import type GameRoom from "../backend/game-room";
import type { AuctionTTTGameStatus, AuctionTTTViewpoint, Player, Settings, Side } from "./types";

export default class AuctionTicTacToe extends GameLogicHandlerBase {
  settings: Settings;
  gameStatus: AuctionTTTGameStatus;
  players: Player[];
  whoseTurnToNominate?: Side
  whoseTurnToBid?: Side
  lastBid?: number
  squares?: Side[][]
  currentlyNominatedSquare?: [number, number]

  constructor(room: GameRoom) {
    super(room);
    this.settings = {
      gameType: GameType.AuctionTTT,
      startingMoney: 15
    }
    this.players = [];
  }

  viewpointOf(viewer: Viewer): AuctionTTTViewpoint {
    if (this.gameStatus === "pregame") {
      return {
        roomCode: this.room.basicRoomInfo.roomCode,
        roomName: this.room.basicRoomInfo.roomName,
        isPrivate: this.room.basicRoomInfo.isPrivate,
        isHost: this.room.host === viewer.index,
        gameStatus: this.gameStatus,
        settings: this.settings,
        players: this.players
      };
    } else if (this.gameStatus === "midgame") {
      return {
        roomCode: this.room.basicRoomInfo.roomCode,
        roomName: this.room.basicRoomInfo.roomName,
        isPrivate: this.room.basicRoomInfo.isPrivate,
        isHost: this.room.host === viewer.index,
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
        roomCode: this.room.basicRoomInfo.roomCode,
        roomName: this.room.basicRoomInfo.roomName,
        isPrivate: this.room.basicRoomInfo.isPrivate,
        isHost: this.room.host === viewer.index,
        gameStatus: this.gameStatus,
        settings: this.settings,
        players: this.players,
        squares: this.squares
      };
    }
  }
}
