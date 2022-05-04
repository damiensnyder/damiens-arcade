import type { BasicViewpointInfo, GameType } from "$lib/types";

export type TourneyGameStage = "pregame" |
    "preseason" |
    "draft" |
    "free agency" |
    "equipment shop" |
    "practice" |
    "seeding challenge" |
    "tournament" |
    "offseason";

export type TourneyViewpoint = PregameViewpoint | MidgameViewpoint;

interface ViewpointBase extends BasicViewpointInfo {
  gameStage: TourneyGameStage
  gameType: GameType.Tourney
  settings: Settings
}

export interface PregameViewpoint extends ViewpointBase {
  gameStage: "pregame"
}

export interface MidgameViewpoint extends ViewpointBase {
  teams: Team[]
}

export interface Team {
  controller: number | "bot"
  name: string
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

interface StartAction {
  type: "start"
}

interface JoinAction {
  type: "join"
}

interface LeaveAction {
  type: "leave"
}

interface ReplaceAction {
  type: "start"
  team: number
}

interface RemoveAction {
  type: "start"
  team: number
}

interface AddBotAction {
  type: "addBot"
}

export type TourneyAction = ChangeGameSettingsAction |
    JoinAction |
    LeaveAction |
    StartAction |
    ReplaceAction |
    RemoveAction |
    AddBotAction;

interface ChangeGameSettingsEvent {
  type: "changeGameSettings"
  settings: Settings
}

interface StartEvent {
  type: "start"
}

interface JoinEvent {
  type: "join"
  controller: number | "bot"
  name: string
}

interface LeaveEvent {
  type: "leave"
  team: number
}

interface ReplaceEvent {
  type: "replace"
  team: number
  controller: number
}

interface RemoveEvent {
  type: "remove"
  team: number
}

export type TourneyEvent = ChangeGameSettingsEvent |
    JoinEvent |
    LeaveEvent |
    StartEvent |
    ReplaceEvent |
    RemoveEvent;