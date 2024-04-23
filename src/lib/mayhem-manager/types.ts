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
  teams: PreseasonTeam[]
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
}

interface TournamentViewpoint extends ViewpointBase {
  gameStage: "tournament"
  bracket: Bracket
  fightersInBattle?: FighterInBattle[]
}



export type /* it so is! */ MayhemManagerExport = (PreseasonExport |
    DraftExport |
    FAExport |
    TrainingExport |
    BRExport |
    TournamentExport);

interface ExportBase {
  gameStage: MayhemManagerGameStage
  settings: Settings
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
  ready?: boolean
}

export interface Fighter {
  name: string
  gender: string
  stats: FighterStats
  oldStats?: FighterStats
  attunements: string[]
  abilities: Abilities
  experience: number
  price: number
  description: string
  flavor: string
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

export interface FighterInBattle extends Fighter {
  team: number
  hp: number
  equipment: Equipment[]
  x: number
  y: number
  cooldown: number
  charge: number
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
  MostEngageable = "mostEngageable",
  AnyEnemy = "anyEnemy",
  AnyTeammate = "anyTeammate",
  ActionTarget = "actionTarget",
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
  tint?: [number, number, number, number]
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
  chargeNeeded?: number
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
  aiHints?: {
    actionDanger?: number
    actionStat?: StatName.Strength | StatName.Accuracy
    passiveDanger?: number
    passiveValue?: number  // doesn't make the fighter a more imminent threat but is valuable
    teammateMultiplier?: boolean
  }
}



export interface Settings {
  customFighters: FighterTemplate[]
  customEquipment: EquipmentTemplate[]
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



interface ChangeGameSettingsAction {
  type: "changeGameSettings"
  settings: Settings
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

export type MayhemManagerAction = ChangeRoomSettingsAction |
    ChangeGameSettingsAction |
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
    ImportAction;



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
  flipped: boolean
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
  tint: [number, number, number, number]
}

export interface MFHpChangeEvent {
  type: "hpChange"
  fighter: number
  newHp: number
}

export interface MFChargeStartEvent {
  type: "chargeStart"
  fighter: number
}

export interface MFChargeEvent {
  type: "charge"
  fighter: number
  newCharge: number
}

export type MidFightEvent = MFSpawnEvent |
    MFMoveEvent |
    MFAnimationEvent |
    MFProjectileEvent |
    MFTextEvent |
    MFTintEvent |
    MFHpChangeEvent |
    MFChargeStartEvent |
    MFChargeEvent;



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