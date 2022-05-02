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
  controller: number | "bot"
  money: number
  fighters: Fighter[]
  equipment: Equipment[]
}

export interface Fighter {
  name: string
  imgUrl: string
  team?: number
  damageTaken?: number
  stats: FighterStats
  abilities: Ability
}

export interface FighterStats {
  strength: number
  accuracy: number
  reflexes: number
  energy: number
  speed: number
  toughness: number
}

export interface Equipment {
  id: string
  name: string
  stats: FighterStats
  abilities: Ability[]
}

export interface Ability {

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