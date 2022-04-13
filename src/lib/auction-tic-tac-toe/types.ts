import type { BasicViewpointInfo, GameType } from "$lib/types";

export type AuctionTTTGameStatus = "pregame" | "midgame" | "postgame";

export enum TurnPart {
  Nominating,
  Bidding,
  None
}

export interface AuctionTTTPublicState {
  gameType: GameType.AuctionTTT
  gameStatus: AuctionTTTGameStatus
  numPlayers: number
}

export type AuctionTTTViewpoint = PregameViewpoint |
    MidgameViewpoint | PostgameViewpoint;

interface ViewpointBase extends BasicViewpointInfo {
  gameStatus: AuctionTTTGameStatus
  gameType: GameType.AuctionTTT
  settings: Settings
  players: Record<Side.X | Side.O, Player>
}

export interface PregameViewpoint extends ViewpointBase {
  gameStatus: "pregame"
}

export interface MidgameViewpointBase extends ViewpointBase {
  gameStatus: "midgame"
  squares: Side[][]
  turnPart: TurnPart
  whoseTurnToNominate: Side
}

interface BiddingViewpoint extends MidgameViewpointBase {
  turnPart: TurnPart.Bidding
  whoseTurnToBid: Side
  lastBid: number
  currentlyNominatedSquare: [number, number]
}

interface NominatingViewpoint extends MidgameViewpointBase {
  turnPart: TurnPart.Nominating
}

type MidgameViewpoint = BiddingViewpoint | NominatingViewpoint;

interface PostgameViewpoint extends ViewpointBase {
  gameStatus: "postgame"
  squares: Side[][]
}

export interface Player {
  money: number
  controller?: number
}

export type Winner = {
  winningSide: Side.None
} | {
  winningSide: Side.X | Side.O,
  start: [number, number],
  end: [number, number]
};

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
  startingMoney?: number
  startingPlayer?: Side
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
    startingMoney: number
    startingPlayer: Side
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

interface AwardSquareEvent {
  type: "awardSquare"
  side: Side
}

type GameOverEvent = {
  type: "gameOver"
} & Winner;

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
    AwardSquareEvent |
    GameOverEvent |
    PassEvent |
    BackToSettingsEvent |
    ReplaceEvent;