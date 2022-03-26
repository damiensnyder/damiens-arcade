import { GameType } from "$lib/types";
import type { PublicRoomState, Viewer } from "$lib/types";
import GameLogicHandlerBase from "$lib/backend/game-logic-handler-base";
import type GameRoom from "$lib/backend/game-room";
import { Side } from "$lib/auction-tic-tac-toe/types";
import type { AuctionTTTGameStatus, AuctionTTTViewpoint, Player, Settings } from "$lib/auction-tic-tac-toe/types";

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
      startingMoney: 15,
      startingPlayer: Side.None
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
        gameType: GameType.AuctionTTT,
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
        roomCode: this.room.basicRoomInfo.roomCode,
        roomName: this.room.basicRoomInfo.roomName,
        isPrivate: this.room.basicRoomInfo.isPrivate,
        isHost: this.room.host === viewer.index,
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
