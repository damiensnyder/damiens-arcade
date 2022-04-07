import type { BasicViewpointInfo, GameType } from "$lib/types";

export type AuctionTTTGameStatus = "pregame" | "midgame" | "postgame";

export enum TurnPart {
  Bidding,
  WaitingForBid,
  Nominating,
  WaitingForNomination,
  None
}

export interface AuctionTTTPublicState {
  gameType: GameType.AuctionTTT
  gameStatus: AuctionTTTGameStatus
  numPlayers: number
}

export type AuctionTTTViewpoint = PregameViewpoint | MidgameViewpoint | PostgameViewpoint;

interface ViewpointBase extends BasicViewpointInfo {
  gameStatus: AuctionTTTGameStatus
  gameType: GameType.AuctionTTT
  settings: Settings
  players: [Player, Player]
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
  nominating?: [number, number]
  currentBid?: number
}

export interface PostgameViewpoint extends ViewpointBase {
  gameStatus: "postgame"
  squares: Side[][]
}

export interface Player {
  money: number
  controller?: number
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

interface ReplacePlayerAction {
  type: "replacePlayer"
  side: Side
}

export type AuctionTTTAction = ChangeGameSettingsAction |
    JoinAction |
    LeaveAction |
    StartGameAction |
    NominateAction |
    BidAction |
    PassAction |
    RematchAction |
    BackToSettingsAction |
    ReplacePlayerAction;

interface ChangeGameSettingsEvent {
  type: "changeGameSettings"
  settings: {
    startingMoney?: number
    startingPlayer?: Side
  }
}

interface JoinEvent {
  type: "join"
  controller: number
  side: Side
}

interface LeaveEvent {
  type: "leave"
  side: Side
}

interface StartEvent {
  type: "start"
  startingPlayer: Side
}

interface NominateEvent {
  type: "nominate",
  square: [number, number],
  startingBid: number
}

interface BidEvent {
  type: "bid",
  amount: number
}

interface PassEvent {
  type: "pass"
}

interface BackToSettingsEvent {
  type: "backToSettings"
}

interface ReplaceEvent {
  type: "replace"
  side: Side
  controller: number
}

export type AuctionTTTEvent = ChangeGameSettingsEvent |
    JoinEvent |
    LeaveEvent |
    StartEvent |
    NominateEvent |
    BidEvent |
    PassEvent |
    BackToSettingsEvent |
    ReplaceEvent;