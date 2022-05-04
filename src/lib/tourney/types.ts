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

export interface ViewpointBase extends BasicViewpointInfo {
  gameStage: TourneyGameStage
  gameType: GameType.Tourney
  settings: Settings
}

interface PregameViewpoint extends ViewpointBase {
  gameStage: "pregame"
}

export type MidgameViewpoint = PreseasonViewpoint |
    DraftViewpoint;

interface MidgameViewpointBase extends ViewpointBase {
  teams: Team[]
}

interface PreseasonViewpoint extends MidgameViewpointBase {
  gameStage: "preseason"
}

interface DraftViewpoint extends MidgameViewpointBase {
  gameStage: "draft"
  draftOrder: number[]
  fighters: Fighter[]
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

interface AdvanceAction {
  type: "advance"
}

interface DraftAction {
  type: "draft",
  fighter: number
}

export type TourneyAction = ChangeGameSettingsAction |
    JoinAction |
    LeaveAction |
    StartAction |
    ReplaceAction |
    RemoveAction |
    AddBotAction |
    AdvanceAction |
    DraftAction;

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

interface GoToDraftEvent {
  type: "goToDraft"
  draftOrder: number[]
  fighters: Fighter[]
}

export type TourneyEvent = ChangeGameSettingsEvent |
    JoinEvent |
    LeaveEvent |
    StartEvent |
    ReplaceEvent |
    RemoveEvent |
    GoToDraftEvent;