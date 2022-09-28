import type { BasicViewpointInfo, ChangeRoomSettingsAction, RoomEvent } from "$lib/types";

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
  spotInDraftOrder: number
  fighters: Fighter[]
}

interface FAViewpoint extends MidgameViewpointBase {
  gameStage: "free agency"
  draftOrder: number[]
  spotInDraftOrder: number
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
  gender: string
  stats: FighterStats
  attunements: string[]
  abilities: Ability
  experience: number
  price: number
  description: string
  flavor: string
}

export enum StatName {
  Strength = "strength",
  Accuracy = "accuracy",
  Reflexes = "reflexes",
  Energy = "energy",
  Speed = "speed",
  Toughness = "toughness"
}

export type FighterStats = {
  [key in StatName]: number;
};

export interface FighterInBattle extends Fighter {
  team: number
  hp: number
  maxHP: number
  equipment: Equipment[]
  x: number
  y: number
  cooldown: number
}

export enum EquipmentSlot {
  Head = "head",
  Hand = "hand",
  Torso = "torso",
  Legs = "legs",
  Feet = "feet"
}

export interface Equipment {
  name: string
  imgUrl: string
  zoomedImgUrl: string
  slots: EquipmentSlot[]
  abilities: Ability[]
  yearsOwned: number
  price: number
  description: string
  flavor: string
}

export interface Ability {}

export interface Map {
  name: string
  imgUrl: string
  features: any[]
}

export interface Strategy {}

export interface Settings {
  fighterDecks: string[]
  equipmentDecks: string[]
  mapDecks: string[]
  customFighters: FighterTemplate[]
  customEquipment: EquipmentTemplate[]
  customMaps: Map[]
}

export interface FighterNames {
  firstNamesM: string[]
  firstNamesF: string[]
  firstNamesA: string[]
  lastNames: string[]
}

export interface FighterDeck extends FighterNames {
  abilities: FighterTemplate[]
}

export interface FighterTemplate {
  imgUrl?: string
  description?: string
  flavor?: string
  price: number
  abilities: Ability[]
}

export interface EquipmentDeck {
  equipment: EquipmentTemplate[]
}

export interface EquipmentTemplate {
  name: string
  slots: EquipmentSlot[]
  imgUrl: string
  zoomedImgUrl: string
  price: number
  description?: string
  flavor?: string
  abilities: any[]
}

export interface MapDeck {
  maps: Map[]
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
  type: "pick"
  index: number
}

interface PassAction {
  type: "pass"
}

interface PracticeAction {
  type: "practice"
  equipment: number[]
  skills: (keyof FighterStats | number)[]
}

interface PickBRFighterAction {
  type: "pickBRFighter"
  fighter: number
  equipment: number[]
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

export type TourneyAction = ChangeRoomSettingsAction |
    ChangeGameSettingsAction |
    JoinAction |
    LeaveAction |
    StartAction |
    ReplaceAction |
    RemoveAction |
    AddBotAction |
    AdvanceAction |
    PickAction |
    PassAction |
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

interface ResignEvent {
  type: "resign"
  team: number
  fighter: number
}

interface RepairEvent {
  type: "repair"
  team: number
  equipment: number
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

interface PassEvent {
  type: "pass"
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
  map: Map
  eventLog: MidFightEvent[][]
}

interface MFSpawnEvent {
  type: "spawn"
  fighter: FighterInBattle
}

interface MFMoveEvent {
  type: "move"
  fighter: number
  x: number
  y: number
}

interface MFMeleeAttackEvent {
  type: "meleeAttack"
  fighter: number
  target: number
  dodged: boolean
  damage: number
}

export type MidFightEvent = MFSpawnEvent |
    MFMoveEvent |
    MFMeleeAttackEvent;

export type Bracket = {
  left: Bracket
  right: Bracket
  winner: number | null
} | {
  winner: number
};

interface BracketEvent {
  type: "bracket"
  bracket: Bracket
}

interface GoToPreseasonEvent {
  type: "goToPreseason"
  teams: PreseasonTeam[]
}

export type TourneyEvent = RoomEvent |
    ChangeGameSettingsEvent |
    JoinEvent |
    LeaveEvent |
    StartEvent |
    ReplaceEvent |
    RemoveEvent |
    ResignEvent |
    RepairEvent |
    GoToDraftEvent |
    PickEvent |
    PassEvent |
    GoToFAEvent |
    GoToTrainingEvent |
    GoToBREvent |
    FightEvent |
    BracketEvent |
    GoToPreseasonEvent;