import { GameType } from "$lib/types";
import type { PublicRoomState, Viewer } from "$lib/types";
import GameLogicHandlerBase from "$lib/backend/game-logic-handler-base";
import type GameRoom from "$lib/backend/game-room";
import { Side } from "$lib/auction-tic-tac-toe/types";
import type { AuctionTTTGameStatus, AuctionTTTViewpoint, Player, Settings } from "$lib/auction-tic-tac-toe/types";
import { getPlayerBySide, getPlayerByController, oppositeSideOf, winningSide } from "$lib/auction-tic-tac-toe/utils";
import { array, number, object, string } from "yup";

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

const startGameSchema = object({
  type: string().required().equals(["startGame"])
});

const nominateSchema = object({
  type: string().required().equals(["nominate"]),
  square: array().required().length(2).of(number().min(0).max(2)),
  startingBid: number().required().min(0)
});

const bidSchema = object({
  type: string().required().equals(["bid"]),
  amount: number().required().min(0)
});

const passSchema = object({
  type: string().required().equals(["pass"])
});

const rematchSchema = object({
  type: string().required().equals(["rematch"])
});

const backToSettingsSchema = object({
  type: string().required().equals(["backToSettings"])
});

const replacePlayerSchema = object({
  type: string().required().equals(["replacePlayer"]),
  side: string().required().oneOf(["X", "O"])
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
    const playerControlledByViewer = getPlayerByController(this.players, viewer.index);
    const sideControlledByViewer =
        playerControlledByViewer === null ?
        Side.None :
        playerControlledByViewer.side;
    const isHost = this.room.host === viewer.index;

    if (this.room.host === viewer.index &&
        changeGameSettingsSchema.isValidSync(action)) {
      this.settings = action.settings as Settings;
      this.emitGamestateToAll();
    } else if (joinSchema.isValidSync(action) &&
        playerControlledByViewer === null) {
      getPlayerBySide(this.players, action.side as Side).controller = viewer.index;
      this.emitGamestateToAll();
    } else if (leaveSchema.isValidSync(action) &&
        this.gameStatus === "pregame" &&
        playerControlledByViewer !== null) {
      delete playerControlledByViewer.controller;
      this.emitGamestateToAll();
    } else if (startGameSchema.isValidSync(action) &&
        this.gameStatus === "pregame" &&
        isHost &&
        this.players.every((player) => player.controller !== undefined)) {
      this.startGame();
      this.emitGamestateToAll();
    } else if (nominateSchema.isValidSync(action) &&
        this.gameStatus === "midgame" &&
        this.squares[action.square[0]][action.square[1]] === Side.None &&
        sideControlledByViewer === this.whoseTurnToNominate &&
        action.startingBid <= playerControlledByViewer.money &&
        action.startingBid >= 0) {
      this.currentlyNominatedSquare = action.square as [number, number];
      this.lastBid = action.startingBid;
      this.whoseTurnToBid = oppositeSideOf(sideControlledByViewer);
      if (this.lastBid >= getPlayerBySide(this.players, this.whoseTurnToBid).money) {
        this.giveSquareToHighestBidder();
      }
      this.emitGamestateToAll();
    } else if (bidSchema.isValidSync(action) &&
        this.gameStatus === "midgame" &&
        sideControlledByViewer === this.whoseTurnToBid &&
        action.amount <= playerControlledByViewer.money &&
        action.amount > this.lastBid) {
      this.lastBid = action.amount;
      this.whoseTurnToBid = oppositeSideOf(sideControlledByViewer);
      if (this.lastBid >= getPlayerBySide(this.players, this.whoseTurnToBid).money) {
        this.giveSquareToHighestBidder();
      }
      this.emitGamestateToAll();
    } else if (passSchema.isValidSync(action) &&
        this.gameStatus === "midgame" &&
        sideControlledByViewer === this.whoseTurnToBid) {
      this.giveSquareToHighestBidder();
      this.emitGamestateToAll();
    } else if (rematchSchema.isValidSync(action) &&
        this.gameStatus === "postgame" &&
        this.room.host === viewer.index) {
      this.startGame();
      this.emitGamestateToAll();
    } else if (backToSettingsSchema.isValidSync(action) &&
        this.gameStatus === "postgame" &&
        this.room.host === viewer.index) {
      this.gameStatus = "pregame";
      delete this.squares;
      this.emitGamestateToAll();
    } else if (replacePlayerSchema.isValidSync(action) &&
        this.gameStatus === "midgame" &&
        playerControlledByViewer === null &&
        getPlayerBySide(this.players, action.side as Side).controller === undefined) {
      getPlayerBySide(this.players, action.side as Side).controller = viewer.index;
      this.emitGamestateToAll();
    } else {
      console.debug(action);
    }
  }

  giveSquareToHighestBidder(): void {
    const sideWhoLastBid = oppositeSideOf(this.whoseTurnToBid);
    this.squares[this.currentlyNominatedSquare[0]][this.currentlyNominatedSquare[1]] = sideWhoLastBid;
    getPlayerBySide(this.players, sideWhoLastBid).money -= this.lastBid;
    delete this.lastBid;
    delete this.whoseTurnToBid;
    this.checkForWinner();
    if (this.gameStatus === "midgame") {
      this.whoseTurnToNominate = oppositeSideOf(this.whoseTurnToNominate);
    }
  }

  startGame(): void {
    this.gameStatus = "midgame";
    this.players.forEach((player) => player.money = this.settings.startingMoney);
    this.whoseTurnToNominate = this.settings.startingPlayer;
    if (this.whoseTurnToNominate === Side.None) {
      this.whoseTurnToNominate = Math.random() > 0.5 ? Side.X : Side.O;
    }
    this.squares = [
      [Side.None, Side.None, Side.None],
      [Side.None, Side.None, Side.None],
      [Side.None, Side.None, Side.None]
    ];
  }

  checkForWinner(): void {
    if (winningSide(this.squares) !== Side.None) {
      this.gameStatus = "postgame";
      delete this.whoseTurnToBid;
      delete this.whoseTurnToNominate;
      delete this.lastBid;
      delete this.currentlyNominatedSquare;
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