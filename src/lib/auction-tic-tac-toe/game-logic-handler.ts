import { GameType } from "$lib/types";
import type { Viewer } from "$lib/types";
import GameLogicHandlerBase from "$lib/backend/game-logic-handler-base";
import type GameRoom from "$lib/backend/game-room";
import { Side, TurnPart, type Winner } from "$lib/auction-tic-tac-toe/types";
import type { AuctionTTTGameStage, AuctionTTTViewpoint, Player, Settings } from "$lib/auction-tic-tac-toe/types";
import { getPlayerByController, getSideByController, oppositeSideOf, winningSide } from "$lib/auction-tic-tac-toe/utils";
import { array, boolean, number, object, string } from "yup";

const changeGameSettingsSchema = object({
  type: string().required().equals(["changeGameSettings"]),
  settings: object({
    startingMoney: number().required().integer().min(0),
    startingPlayer: string().required().oneOf(Object.values(Side)),
    useTiebreaker: boolean().required()
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
  type: string().required().equals(["start"])
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

export default class AuctionTicTacToe extends GameLogicHandlerBase {
  settings: Settings
  gameType: GameType.AuctionTTT
  gameStage: AuctionTTTGameStage
  players: Record<Side.X | Side.O, Player>
  turnPart: TurnPart
  whoseTurnToNominate?: Side
  whoseTurnToBid?: Side
  lastBid?: number
  squares?: Side[][]
  timeOfLastMove?: number
  currentlyNominatedSquare?: [number, number]
  winner?: Winner

  constructor(room: GameRoom) {
    super(room);
    this.settings = {
      startingMoney: 15,
      startingPlayer: Side.None,
      useTiebreaker: false
    };
    this.players = {
      X: {
        money: 0
      },
      O: {
        money: 0
      }
    };
  }

  handleAction(viewer: Viewer, action?: any): void {
    const playerControlledByViewer = getPlayerByController(this.players, viewer.index);
    const sideControlledByViewer = getSideByController(this.players, viewer.index);
    const isHost = this.room.host === viewer.index;

    // JOIN
    if (joinSchema.isValidSync(action) &&
        sideControlledByViewer === Side.None &&
        this.players[action.side].controller === undefined) {
      this.players[action.side].controller = viewer.index;
      this.emitEventToAll({
        type: "join",
        controller: viewer.index,
        side: action.side as Side
      });

      // LEAVE
    } else if (leaveSchema.isValidSync(action) &&
        this.gameStage === "pregame" &&
        playerControlledByViewer !== null) {
      delete playerControlledByViewer.controller;
      this.emitEventToAll({
        type: "leave",
        side: sideControlledByViewer
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
        isHost &&
        this.players.X.controller !== undefined &&
        this.players.O.controller !== undefined) {
      this.startGame();
      this.emitEventToAll({
        type: "start",
        startingPlayer: this.whoseTurnToNominate
      });

      // NOMINATE
    } else if (nominateSchema.isValidSync(action) &&
        this.gameStage === "midgame" &&
        this.squares[action.square[0]][action.square[1]] === Side.None &&
        sideControlledByViewer === this.whoseTurnToNominate &&
        this.lastBid === undefined &&
        action.startingBid <= playerControlledByViewer.money &&
        action.startingBid >= 0) {
      this.currentlyNominatedSquare = action.square as [number, number];
      this.lastBid = action.startingBid;
      this.whoseTurnToBid = oppositeSideOf(sideControlledByViewer);
      this.emitEventToAll({
        type: "nominate",
        square: action.square as [number, number],
        startingBid: action.startingBid
      });
      this.updateTiming(sideControlledByViewer);

      // if the other player can't afford to outbid it, award the square immediately
      if (this.lastBid >= this.players[this.whoseTurnToBid].money) {
        this.giveSquareToHighestBidder();
      } else {
        this.turnPart = TurnPart.Bidding;
      }

      // BID
    } else if (bidSchema.isValidSync(action) &&
        this.gameStage === "midgame" &&
        sideControlledByViewer === this.whoseTurnToBid &&
        action.amount <= playerControlledByViewer.money &&
        action.amount > this.lastBid) {
      this.lastBid = action.amount;
      this.whoseTurnToBid = oppositeSideOf(sideControlledByViewer);
      this.emitEventToAll({
        type: "bid",
        amount: action.amount
      });
      this.updateTiming(sideControlledByViewer);

      // if the other player can't afford to outbid it, award the square immediately
      if (this.lastBid >= this.players[this.whoseTurnToBid].money) {
        this.giveSquareToHighestBidder();
      }

      // PASS
    } else if (passSchema.isValidSync(action) &&
        this.gameStage === "midgame" &&
        sideControlledByViewer === this.whoseTurnToBid) {
      this.emitEventToAll({ type: "pass" });
      this.updateTiming(sideControlledByViewer);
      this.giveSquareToHighestBidder();

      // REMATCH
    } else if (rematchSchema.isValidSync(action) &&
        this.gameStage === "postgame" &&
        this.players.X.controller !== undefined &&
        this.players.O.controller !== undefined &&
        this.room.host === viewer.index) {
      this.startGame();
      this.emitEventToAll({
        type: "start",
        startingPlayer: this.whoseTurnToNominate
      });
    
      // BACK TO SETTINGS
    } else if (backToSettingsSchema.isValidSync(action) &&
        this.gameStage === "postgame" &&
        this.room.host === viewer.index) {
      this.gameStage = "pregame";
      delete this.squares;
      this.emitEventToAll({ type: "backToSettings" });
    } else {
      console.debug("INVALID ACTION");
    }
  }

  giveSquareToHighestBidder(): void {
    // give the square to whoever's turn it isn't to bid, and take away the money they spent
    const sideWhoLastBid = oppositeSideOf(this.whoseTurnToBid);
    this.squares[this.currentlyNominatedSquare[0]][this.currentlyNominatedSquare[1]] = sideWhoLastBid;
    this.players[sideWhoLastBid].money -= this.lastBid;
    this.emitEventToAll({
      type: "awardSquare",
      side: sideWhoLastBid
    });
    delete this.lastBid;
    delete this.whoseTurnToBid;
    delete this.currentlyNominatedSquare;

    // check to see if the game ended, and if not, switch who nominates
    if (!this.checkForWinner()) {
      this.whoseTurnToNominate = oppositeSideOf(this.whoseTurnToNominate);
      this.turnPart = TurnPart.Nominating;
    }
  }

  startGame(): void {
    this.gameStage = "midgame";
    this.turnPart = TurnPart.Nominating;
    this.players.X.money = this.settings.startingMoney;
    this.players.O.money = this.settings.startingMoney;
    this.whoseTurnToNominate = this.settings.startingPlayer;
    if (this.whoseTurnToNominate === Side.None) {
      this.whoseTurnToNominate = Math.random() > 0.5 ? Side.X : Side.O;
    }
    this.squares = [
      [Side.None, Side.None, Side.None],
      [Side.None, Side.None, Side.None],
      [Side.None, Side.None, Side.None]
    ];

    // if using the timer tiebreaker, initialize time used
    if (this.settings.useTiebreaker) {
      this.players.X.timeUsed = 0;
      this.players.O.timeUsed = 0;
      this.timeOfLastMove = new Date().getTime();
    }

    delete this.winner;
  }

  updateTiming(side: Side) {
    // if using the timer tiebreaker, update time used
    if (this.settings.useTiebreaker) {
      this.players[side].timeUsed += new Date().getTime() - this.timeOfLastMove;
      this.timeOfLastMove = new Date().getTime();
      this.emitEventToAll({
        type: "timing",
        X: this.players.X.timeUsed,
        O: this.players.O.timeUsed,
        timeOfLastMove: this.timeOfLastMove
      });
    }
  }

  checkForWinner(): boolean {
    this.winner = winningSide(this.squares);

    // if someone has a 3-in-a-row or every square is filled
    if (this.winner.winningSide !== Side.None ||
        this.squares.every((row) => row.every((square) => square !== Side.None))) {
      // if using the timing tiebreaker, break the tie
      if (this.settings.useTiebreaker && this.winner.winningSide === Side.None) {
        // the winning side is whoever used less time
        this.winner = {
          winningSide: this.players.X.timeUsed < this.players.O.timeUsed ? Side.X : Side.O,
          start: [-1, -1],
          end: [-1, -1]
        };
      }

      this.gameStage = "postgame";
      this.emitEventToAll({
        type: "gameOver",
        ...this.winner
      });
      this.turnPart = TurnPart.None;
      delete this.whoseTurnToBid;
      delete this.whoseTurnToNominate;
      delete this.lastBid;
      delete this.currentlyNominatedSquare;
      delete this.timeOfLastMove;

      return true;
    }
    return false;
  }

  handleDisconnect(viewer: Viewer, wasHost: boolean): void {
    const sideControlledByViewer = getSideByController(this.players, viewer.index);
    const playerControlledByViewer = getPlayerByController(this.players, viewer.index);
    if (sideControlledByViewer !== Side.None) {
      delete playerControlledByViewer.controller;
      this.emitEventToAll({
        type: "leave",
        side: sideControlledByViewer
      });
    }
    super.handleDisconnect(viewer, wasHost);
  }

  viewpointOf(viewer: Viewer): AuctionTTTViewpoint {
    if (this.gameStage === "pregame") {
      return {
        ...this.basicViewpointInfo(viewer),
        gameType: GameType.AuctionTTT,
        gameStage: this.gameStage,
        settings: this.settings,
        players: this.players
      };
    } else if (this.gameStage === "midgame") {
      if (this.turnPart === TurnPart.Bidding) {
        return {
          ...this.basicViewpointInfo(viewer),
          gameType: GameType.AuctionTTT,
          gameStage: this.gameStage,
          settings: this.settings,
          turnPart: this.turnPart,
          players: this.players,
          whoseTurnToNominate: this.whoseTurnToNominate,
          whoseTurnToBid: this.whoseTurnToBid,
          lastBid: this.lastBid,
          squares: this.squares,
          currentlyNominatedSquare: this.currentlyNominatedSquare,
          timeOfLastMove: this.timeOfLastMove
        };
      } else {
        return {
          ...this.basicViewpointInfo(viewer),
          gameType: GameType.AuctionTTT,
          gameStage: this.gameStage,
          settings: this.settings,
          turnPart: TurnPart.Nominating,
          players: this.players,
          whoseTurnToNominate: this.whoseTurnToNominate,
          squares: this.squares,
          timeOfLastMove: this.timeOfLastMove
        };
      }
    } else if (this.gameStage === "postgame") {
      return {
        ...this.basicViewpointInfo(viewer),
        gameType: GameType.AuctionTTT,
        gameStage: this.gameStage,
        settings: this.settings,
        players: this.players,
        squares: this.squares,
        winner: this.winner
      };
    }
  }
}