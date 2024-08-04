import type { BasicViewpointInfo, ChangeRoomSettingsAction, RoomEvent } from "$lib/types";
import type { FighterInBattle } from "./battle-logic";

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
  history: Bracket[]
  teams: Team[]
}

export interface PreseasonViewpoint extends ViewpointBase {
  gameStage: "preseason"
  teams: PreseasonTeam[]
  ready: boolean[]
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
  ready: boolean[]
}

interface BRViewpoint extends ViewpointBase {
  gameStage: "battle royale"
  ready?: boolean[]
  fightersInBattle?: FighterInBattle[]
}

interface TournamentViewpoint extends ViewpointBase {
  gameStage: "tournament"
  bracket: Bracket
  ready?: boolean[]
  fightersInBattle?: FighterInBattle[]
}



export type /* it so is! */ MayhemManagerExport = (PreseasonExport |
    DraftExport |
    FAExport |
    TrainingExport |
    BRExport |
    TournamentExport);

export interface ExportBase {
  gameStage: MayhemManagerGameStage
  // history: string[][]
  teams: Team[]
}

interface PreseasonExport extends ExportBase {
  gameStage: "preseason"
  teams: PreseasonTeam[]
}

interface DraftExport extends ExportBase {
  gameStage: "draft"
  draftOrder: number[]
  spotInDraftOrder: number
  fighters: Fighter[]
  unsignedVeterans: Fighter[]
}

interface FAExport extends ExportBase {
  gameStage: "free agency"
  draftOrder: number[]
  spotInDraftOrder: number
  fighters: Fighter[]
}

interface TrainingExport extends ExportBase {
  gameStage: "training"
  equipmentAvailable: Equipment[][]
}

interface BRExport extends ExportBase {
  gameStage: "battle royale"
}

interface TournamentExport extends ExportBase {
  gameStage: "tournament"
  bracketOrdering: number[]
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

export interface AbilityHaver {
  price: number
  description: string
  flavor: string
  abilityName: string
}

export interface Fighter extends AbilityHaver {
  name: string
  stats: FighterStats
  oldStats?: FighterStats
  attunements: string[]
  experience: number
  appearance: Appearance
}

// first is in battle, RGB-based. second is for HTML5 image transform and uses hue-rotate and such.
export type Color = [[number, number, number], ([number, number] | [number, number, number])];

export interface Appearance {
  body: string
  hair: string
  face: string
  shirt: string
  shorts: string
  socks: string
  shoes: string
  hairColor: Color
  skinColor: Color
  shirtColor: Color
  shortsColor: Color
  shoesColor: Color
}

export enum StatName {
  Strength = "strength",
  Accuracy = "accuracy",
  Energy = "energy",
  Speed = "speed",
  Toughness = "toughness"
}

export type FighterStats = {
  [key in StatName]: number;
};

/*
export interface FighterInBattle {
  team: number
  name: string
  hp: number
  equipment: EquipmentInBattle[]
  x: number
  y: number
  cooldown: number
  charge: number
  stats: FighterStats
  appearance: Appearance
  attunements: string[]
  statusEffects: StatChangeEffect[]
  fight: Fight
}
*/

export enum EquipmentSlot {
  Head = "head",
  Hand = "hand",
  Torso = "torso",
  Legs = "legs",
  Feet = "feet"
}

export interface Equipment extends AbilityHaver {
  name: string
  slots: EquipmentSlot[]
  imgUrl: string
  zoomedImgUrl: string
  yearsOwned: number
}

export interface Abilities {
  state?: any
  isFighterAbility?: boolean
  getActionPriority?: (self: EquipmentInBattle) => number
  actionDanger?: (self: EquipmentInBattle) => number
  passiveDanger?: (self: EquipmentInBattle) => number
  whenPrioritized?: (self: EquipmentInBattle) => void
  onFightStart?: (self: EquipmentInBattle) => void
  onTick?: (self: EquipmentInBattle) => void
  onHitDealt?: (self: EquipmentInBattle, target: FighterInBattle, damage: number, equipmentUsed: EquipmentInBattle) => void
  onHitTaken?: (self: EquipmentInBattle, attacker: FighterInBattle, damage: number, equipmentUsed: EquipmentInBattle) => void
}

export interface EquipmentInBattle extends Abilities {
  name: string
  slots: EquipmentSlot[]
  imgUrl: string
  fighter?: FighterInBattle
}



export interface FighterNames {
  firstNamesM: string[]
  firstNamesF: string[]
  lastNames: string[]
}

export interface FighterTemplate {
  imgUrl?: string
  description?: string
  flavor?: string
  price: number
  abilities: Abilities
}

export interface EquipmentTemplate {
  name: string
  slots: EquipmentSlot[]
  imgUrl: string
  zoomedImgUrl: string
  price: number
  description: string
  flavor: string
  abilities: Abilities
}



interface JoinAction {
  type: "join"
  name: string
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

interface ReadyAction {
  type: "ready"
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
}

interface PickFightersAction {
  type: "pickFighters"
  equipment: number[]
}

interface ResignAction {
  type: "resign"
  fighter: number
}

interface RepairAction {
  type: "repair"
  equipment: number
}

type ImportAction = {
  type: "import"
} & MayhemManagerExport;

type ExportAction = {
  type: "export"
};

export type MayhemManagerAction = ChangeRoomSettingsAction |
    JoinAction |
    LeaveAction |
    ReplaceAction |
    RemoveAction |
    ReadyAction |
    AddBotAction |
    AdvanceAction |
    PickAction |
    PassAction |
    PracticeAction |
    PickBRFighterAction |
    PickFightersAction |
    RepairAction |
    ResignAction |
    ImportAction |
    ExportAction;



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

interface ReadyEvent {
  type: "ready"
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
  eventLog: MidFightEvent[][]
}

interface ExportLeagueEvent {
  type: "exportLeague",
  league: MayhemManagerExport
}



export enum RotationState {
  Stationary1 = 0,
  Stationary2 = 0.0001,
  WalkingStart1 = -8,
  Walking1 = -8.0001,
  WalkingStart2 = 8,
  Walking2 = 8.0001,
  BackswingStart = -11.0001,
  Backswing = -11,
  ForwardSwing = 30,
  AimStart = -5,
  Aim = -7
}

export type Tint = [number, number, number, number];

export interface StatusEffect {
  name: string
  duration: number
  tint: Tint
  onClear: (self: FighterInBattle) => void
}

export interface PartialFighterVisual {
  name?: string
  team?: number
  stats?: FighterStats
  appearance?: Appearance
  equipment?: EquipmentInBattle[]
  description?: string
  flavor?: string
  experience?: number
  tint?: Tint
  flash?: number
  x?: number
  y?: number
  hp?: number
  facing?: number
  rotation?: RotationState
}

export interface FighterVisual {
  name: string
  team: number
  stats: FighterStats
  appearance: Appearance
  equipment: EquipmentInBattle[]
  description: string
  flavor: string
  experience: number
  tint: Tint
  flash: number
  x: number
  y: number
  hp: number
  facing: number
  rotation: number
}

export interface MFSpawnEvent {
  type: "spawn"
  fighter: FighterVisual
}

export interface MFAnimationEvent {
  type: "animation"
  fighter: number
  updates: PartialFighterVisual
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

export interface MFParticleEvent {
  type: "particle"
  fighter: number
  particleImg: string
}

export type MidFightEvent = MFSpawnEvent |
    MFAnimationEvent |
    MFProjectileEvent |
    MFTextEvent |
    MFParticleEvent;



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
    JoinEvent |
    LeaveEvent |
    ReplaceEvent |
    RemoveEvent |
    ReadyEvent |
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
    GoToPreseasonEvent |
    ExportLeagueEvent;