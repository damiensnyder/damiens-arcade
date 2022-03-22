import type { Action, GameType, Viewer } from "$lib/types";
import GameLogicHandler from "./game-logic-handler";

export interface AuctionTTTPublicState {
  gameType: GameType.AuctionTTT,
  numPlayers: number
}

/*export interface AuctionTTTGamestate {
  whoseTurnToNominate?: number,
  whoseTurnToBid?: number,
  lastBid?: number,
  playerWhoMadeLastBid?: number
  players: AuctionTTTPlayer[]
  squares?: number[][]
  currentlyNominatedSquare?: [number, number]
}

export interface AuctionTTTPlayer {
  name: string,
  dollars: number
}*/

// Settings for auction tic-tac-toe
export interface AuctionTTTSettings {
  startingMoney: number,
  startingPlayer?: number
}

export default class AuctionTicTacToe extends GameLogicHandler {}
