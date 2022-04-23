import type { BasicViewpointInfo, GameType } from "$lib/types";

export type AuctionTTTGameStatus = "pregame" | "midgame" | "postgame";

export enum TurnPart {
  Nominating,
  Bidding,
  None
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
  timeOfLastMove?: number
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
  winner: Winner
}

export interface Player {
  money: number
  controller?: number
  timeUsed?: number
}

interface NoWinner {
  winningSide: Side.None;
}

interface WinnerExists {
  winningSide: Side.X | Side.O
  start: [number, number]
  end: [number, number]
}

export type Winner = NoWinner | WinnerExists;

export enum Side {
  X = "X",
  O = "O",
  None = "[none]"
}

export interface Settings {
  startingMoney: number
  startingPlayer: Side
  useTiebreaker: boolean
}

interface ChangeGameSettingsAction {
  type: "changeGameSettings"
  settings: Settings
}

interface JoinAction {
  type: "join",
  side: Side.X | Side.O
}

interface LeaveAction {
  type: "leave"
}

interface StartGameAction {
  type: "start"
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

interface ChangeGameSettingsEvent {
  type: "changeGameSettings"
  settings: Settings
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

interface TimingEvent {
  type: "timing"
  X: number
  O: number
  timeOfLastMove: number
}

interface NominateEvent {
  type: "nominate"
  square: [number, number]
  startingBid: number
}

interface BidEvent {
  type: "bid"
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

export type AuctionTTTEvent = ChangeGameSettingsEvent |
    JoinEvent |
    LeaveEvent |
    StartEvent |
    TimingEvent |
    NominateEvent |
    BidEvent |
    PassEvent |
    AwardSquareEvent |
    GameOverEvent |
    BackToSettingsEvent;