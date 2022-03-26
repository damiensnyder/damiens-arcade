import type { GameType } from "$lib/types";

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
  whoseTurnToNominate: Side
  whoseTurnToBid?: Side
  lastBid?: number
  squares: Side[][]
  currentlyNominatedSquare?: [number, number]
}

export interface PostgameViewpoint extends ViewpointBase {
  gameStatus: "postgame"
  squares: Side[][]
}

export interface Player {
  side: Side
  dollars: number
}

export enum Side {
  X = "X",
  O = "O",
  None = "[none]"
}

export interface Settings {
  gameType: GameType.AuctionTTT
  startingMoney: number
  startingPlayer?: number
}

interface ChangeGameSettingsAction {
  type: "changeGameSettings"
  settings: {
    startingMoney: number
    startingPlayer?: number
  }
}

export type AuctionTTTAction = ChangeGameSettingsAction;