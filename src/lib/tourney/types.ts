import type { BasicViewpointInfo, GameType } from "$lib/types";

export type TourneyGameStatus = "pregame" |
    "preseason" |
    "draft" |
    "free agency" |
    "equipment shop" |
    "practice" |
    "seeding challenge" |
    "tournament" |
    "offseason";

export type TourneyViewpoint = PregameViewpoint;

interface ViewpointBase extends BasicViewpointInfo {
  gameStatus: TourneyGameStatus
  gameType: GameType.Tourney
  settings: Settings
  teams: Team[]
}

export interface PregameViewpoint extends ViewpointBase {
  gameStatus: "pregame"
}

export interface Team {
  money: number
  controller: number | "bot"
}

export interface Settings {
  stages?: any
  fighters?: any
  equipment?: any
}

interface ChangeGameSettingsAction {
  type: "changeGameSettings"
  settings: Settings
}

interface JoinAction {
  type: "join"
}

interface LeaveAction {
  type: "leave"
}

interface StartGameAction {
  type: "start"
}

export type TourneyAction = ChangeGameSettingsAction |
    JoinAction |
    LeaveAction |
    StartGameAction;

interface ChangeGameSettingsEvent {
  type: "changeGameSettings"
  settings: Settings
}

interface JoinEvent {
  type: "join"
  controller: number | "bot"
}

interface LeaveEvent {
  type: "leave"
  team: number
}

interface StartEvent {
  type: "start"
}

export type TourneyEvent = ChangeGameSettingsEvent |
    JoinEvent |
    LeaveEvent |
    StartEvent;