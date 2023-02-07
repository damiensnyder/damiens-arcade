import type { BasicViewpointInfo, ChangeRoomSettingsAction, RoomEvent } from "$lib/types";

export type MayhemManagerGameStage = "preseason" |
    "draft" |
    "free agency" |
    "training" |
    "battle royale" |
    "tournament";

export type MayhemManagerViewpoint = PreseasonViewpoint |
    DraftViewpoint |
    FAViewpoint |
    TrainingViewpoint |
    BRViewpoint |
    TournamentViewpoint;

export interface ViewpointBase extends BasicViewpointInfo {
  gameStage: MayhemManagerGameStage
  settings: Settings
  history: Bracket[]
  teams: Team[]
}

interface PreseasonViewpoint extends ViewpointBase {
  gameStage: "preseason"
}

interface DraftViewpoint extends ViewpointBase {
  gameStage: "draft"
  draftOrder: number[]
  spotInDraftOrder: number
  fighters: Fighter[]
}

interface FAViewpoint extends ViewpointBase {
  gameStage: "free agency"
  draftOrder: number[]
  spotInDraftOrder: number
  fighters: Fighter[]
}

interface TrainingViewpoint extends ViewpointBase {
  gameStage: "training"
}

interface BRViewpoint extends ViewpointBase {
  gameStage: "battle royale"
  fightersInBattle?: FighterInBattle[]
  map?: number
}

interface TournamentViewpoint extends ViewpointBase {
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
  abilities: Abilities
  experience: number
  price: number
  description: string
  flavor: string
}

export enum StatName {
  Strength = "strength",
  Accuracy = "accuracy",
  Energy = "energy",
  Speed = "speed",
  Reflexes = "reflexes",
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
  statusEffects: StatChangeEffect[]
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
  abilities: Abilities
  yearsOwned: number
  price: number
  description: string
  flavor: string
}



export enum Trigger {
  HitDealt = "hitDealt",
  HitTaken = "hitTaken",
  Interval = "interval"
}

export enum Target {
  Self = "self",
  Melee = "melee",
  AnyEnemy = "anyEnemy",
  AnyTeammate = "anyTeammate",
  ActionTarget = "attackTarget",
  AllTeammates = "allTeammates",
  AllEnemies = "allEnemies",
  NearestEnemy = "nearestEnemy",
  RandomEnemy = "randomEnemy",
  RandomTeammate = "randomTeammate",
  AllFighters = "allFighters"
}

export enum ActionAnimation {
  Aim = "aim",
  Swing = "swing"
}

export interface StatChangeAbility {
  stat: StatName
  amount: number
}

export interface HpChangeEffect {
  type: "hpChange"
  amount: number
}

export interface DamageEffect {
  type: "damage"
  amount: number
}

export interface StatChangeEffect {
  type: "statChange"
  stat: StatName
  amount: number
  duration: number
  tint?: string
}

export type Effect = HpChangeEffect |
  DamageEffect |
  StatChangeEffect;

export type TriggeredEffect = Effect & {
  trigger: Trigger
  target: Target
}

export interface ActionAbility {
  target: Target
  effects: Effect[]
  cooldown: number
  dodgeable?: boolean
  missable?: boolean
  animation?: ActionAnimation
  projectileImg?: string
  knockback?: number
}

export interface Abilities {
  action?: ActionAbility
  statChanges?: StatChangeAbility[]
  triggeredEffects?: TriggeredEffect[]
}



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
  abilities: Abilities
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

interface JoinAction {
  type: "join"
}

interface LeaveAction {
  type: "leave"
}

interface ReplaceAction {
  type: "replace"
  team: number
}

interface RemoveAction {
  type: "remove"
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

export type MayhemManagerAction = ChangeRoomSettingsAction |
    ChangeGameSettingsAction |
    JoinAction |
    LeaveAction |
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



export interface MFSpawnEvent {
  type: "spawn"
  fighter: FighterInBattle
}

export interface MFMoveEvent {
  type: "move"
  fighter: number
  x: number
  y: number
}

export interface MFAnimationEvent {
  type: "animation"
  fighter: number
  animation: ActionAnimation
}

export interface MFProjectileEvent {
  type: "projectile"
  fighter: number
  target: number
  projectileImg: string
}

export interface MFTextEvent {
  type: "text"
  fighter: number
  text: string
}

export interface MFTintEvent {
  type: "tint"
  fighter: number
  tint: string
}

export interface MFHpChangeEvent {
  type: "hpChange"
  fighter: number
  newHp: number
}

export type MidFightEvent = MFSpawnEvent |
    MFMoveEvent |
    MFAnimationEvent |
    MFProjectileEvent |
    MFTextEvent |
    MFTintEvent |
    MFHpChangeEvent;



export type Bracket = {
  left: Bracket
  right: Bracket
  winner: number | string | null
} | {
  winner: number | string
};

interface BracketEvent {
  type: "bracket"
  bracket: Bracket
}

interface GoToPreseasonEvent {
  type: "goToPreseason"
  teams: PreseasonTeam[]
  history: Bracket[]
}

export type MayhemManagerEvent = RoomEvent |
    ChangeGameSettingsEvent |
    JoinEvent |
    LeaveEvent |
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