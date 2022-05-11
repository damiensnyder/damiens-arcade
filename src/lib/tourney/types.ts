import type { BasicViewpointInfo, GameType } from "$lib/types";

export type TourneyGameStage = "pregame" |
    "preseason" |
    "draft" |
    "free agency" |
    "training" |
    "battle royale" |
    "tournament";

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
    DraftViewpoint |
    FAViewpoint |
    TrainingViewpoint |
    BRViewpoint |
    TournamentViewpoint;

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

interface FAViewpoint extends MidgameViewpointBase {
  gameStage: "free agency"
  draftOrder: number[]
  fighters: Fighter[]
}

interface TrainingViewpoint extends MidgameViewpointBase {
  gameStage: "training"
}

interface BRViewpoint extends MidgameViewpointBase {
  gameStage: "battle royale"
  fightersInBattle?: FighterInBattle[]
  map?: number
}

interface TournamentViewpoint extends MidgameViewpointBase {
  gameStage: "tournament"
  bracket: Bracket
  fightersInBattle?: FighterInBattle[]
  map?: number
}

export interface Team {
  controller: number | "bot"
  name: string
  money: number
  fighters: Fighter[]
  equipment: Equipment[]
}

export interface PreseasonTeam extends Team {
  needsResigning: Fighter[]
  needsRepair: Equipment[]
}

export interface Fighter {
  name: string
  imgUrl: string
  stats: FighterStats
  attunements: number[]
  abilities: Ability
  yearsLeft: number
  price?: number
}

export interface FighterStats {
  strength: number
  accuracy: number
  reflexes: number
  energy: number
  speed: number
  toughness: number
}

export interface FighterInBattle {
  team: number
  hp: number
  maxHP: number
  damageTaken: number
  equipment: Equipment[]
  x: number
  y: number
}

export enum EquipmentSlot {
  Head,
  LeftArm,
  RightArm,
  Torso,
  Legs,
  Feet
}

export interface Equipment {
  name: string
  imgUrl: string
  stats: FighterStats
  slot: EquipmentSlot
  abilities: Ability[]
  durability: number
  price?: number
}

export interface Ability {}

export interface Strategy {}

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

interface PickAction {
  type: "draft"
  index: number
}

interface PracticeAction {
  type: "practice"
  skills: (keyof FighterStats | number)[]
}

interface PickBRFighterAction {
  type: "pickBRFighter"
  fighter: number
  equipment: number
  strategy: Strategy
}

interface PickFightersAction {
  type: "pickFighters"
  equipment: number[]
  strategy: Strategy[]
}

interface ResignAction {
  type: "resign"
  fighter: number
}

interface RepairAction {
  type: "repair"
  equipment: number
}

export type TourneyAction = ChangeGameSettingsAction |
    JoinAction |
    LeaveAction |
    StartAction |
    ReplaceAction |
    RemoveAction |
    AddBotAction |
    AdvanceAction |
    PickAction |
    PracticeAction |
    PickBRFighterAction |
    PickFightersAction |
    RepairAction |
    ResignAction;

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

interface PickEvent {
  type: "pick"
  fighter: number
}

interface GoToFAEvent {
  type: "goToFA"
  fighters: Fighter[]
}

interface GoToTrainingEvent {
  type: "goToTraining"
  equipment?: Equipment[]
}

interface GoToBREvent {
  type: "goToBR"
  teams: Team[]
}

interface FightEvent {
  type: "fight"
  fighters: FighterInBattle[]
  map: number
}

export type Bracket = {
  left: Bracket
  right: Bracket
  winner: number
} | {
  winner: number
}

interface BracketEvent {
  type: "bracket"
  bracket: Bracket
}

interface GoToPreseasonEvent {
  type: "goToPreseason"
  teams: PreseasonTeam[]
}

export type TourneyEvent = ChangeGameSettingsEvent |
    JoinEvent |
    LeaveEvent |
    StartEvent |
    ReplaceEvent |
    RemoveEvent |
    GoToDraftEvent |
    PickEvent |
    GoToFAEvent |
    GoToTrainingEvent |
    GoToBREvent |
    FightEvent |
    BracketEvent |
    GoToPreseasonEvent;