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
  gameType: GameType.AuctionTTT
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
  startingMoney: number
  startingPlayer: Side
}

interface ChangeGameSettingsAction {
  type: "changeGameSettings"
  settings: {
    startingMoney: number
    startingPlayer: Side
  }
}

interface JoinAction {
  type: "join",
  side: Side.X | Side.O
}

interface LeaveAction {
  type: "leave"
}

interface StartGameAction {
  type: "startGame"
}

interface NominateAction {
  type: "nominate",
  square: [number, number],
  startingBid: number
}

interface BidAction {
  type: "bid",
  amount: number
}

interface PassAction {
  type: "pass"
}

interface RematchAction {
  type: "rematch"
}

interface BackToSettingsAction {
  type: "backToSettings"
}

export type AuctionTTTAction = ChangeGameSettingsAction |
    JoinAction |
    LeaveAction |
    StartGameAction |
    NominateAction |
    BidAction |
    PassAction |
    RematchAction |
    BackToSettingsAction;