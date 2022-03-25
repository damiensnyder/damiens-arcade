import type { GameType } from "$lib/types";
import GameLogicHandler from "./game-logic-handler";

export type AuctionTTTGameStatus = "pregame" | "midgame" | "postgame"

export interface AuctionTTTPublicState {
  gameType: GameType.AuctionTTT
  gameStatus: AuctionTTTGameStatus
  numPlayers: number
}

export type AuctionTTTViewpoint = PregameViewpoint | MidgameViewpoint | PostgameViewpoint;

interface ViewpointBase {
  roomCode: string
  roomName: string
  isPrivate: boolean
  isHost: boolean
  gameStatus: AuctionTTTGameStatus
  settings: Settings
  players: Player[]
  pov?: number
}

export interface PregameViewpoint extends ViewpointBase {
  gameStatus: "pregame"
}

export interface MidgameViewpoint extends ViewpointBase {
  gameStatus: "midgame"
  whoseTurnToNominate: number
  whoseTurnToBid?: number
  lastBid?: number
  playerWhoMadeLastBid?: number
  squares: number[][]
  currentlyNominatedSquare?: [number, number]
}

export interface PostgameViewpoint extends ViewpointBase {
  gameStatus: "postgame"
  squares: number[][]
}

export interface Player {
  name: string
  dollars: number
}

export interface Settings {
  gameType: GameType.AuctionTTT
  startingMoney: number
  startingPlayer?: number
}

export default class AuctionTicTacToe extends GameLogicHandler {
  
}
