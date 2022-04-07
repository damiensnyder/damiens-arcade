import type { Socket } from "socket.io";
import type { AuctionTTTAction, AuctionTTTEvent, AuctionTTTGameStatus, AuctionTTTPublicState, AuctionTTTViewpoint } from "$lib/auction-tic-tac-toe/types";
import type { NoneGameStatus, NonePublicState, NoneViewpoint } from "$lib/no-game-selected/types";
import type { TestRoomAction } from "$lib/backend/set-up-test-rooms";

export interface PublicRoomInfo {
  roomName: string
  roomCode: string
  isPublic: boolean
  roomState: PublicRoomState
}

export enum PacketType {
  Connect = "connect",
  Disconnect = "disconnect",
  Action = "action"
}

export enum GameType {
  NoGameSelected = "[none selected]",
  AuctionTTT = "Auction Tic-Tac-Toe"
}

// The information shown about a game on the join menu
export type PublicRoomState = NonePublicState |
    AuctionTTTPublicState;

export type GameStatus = NoneGameStatus |
    AuctionTTTGameStatus;

export interface BasicViewpointInfo {
  roomCode: string
  roomName: string
  isPublic: boolean
  host: number
  pov: number
  connected: boolean
  gameType: GameType
}

export type Viewpoint = NoneViewpoint |
    AuctionTTTViewpoint;

interface ChangeGameTypeAction {
  type: "changeGameType"
  newGameType: GameType
}

interface ChangeSettingsAction {
  type: "changeRoomSettings"
  settings: {
    roomName: string
    isPublic: boolean
  }
}

export type RoomAction = ChangeGameTypeAction | ChangeSettingsAction;

export type Action = RoomAction |
    TestRoomAction |
    AuctionTTTAction;

interface ChangeRoomSettingsEvent {
  type: "changeRoomSettings"
  settings: {
    roomName?: string
    isPublic?: boolean
  }
}

interface ChangeGameTypeEvent {
  type: "changeGameType"
  gameType: GameType
}

interface ChangeHostEvent {
  type: "changeHost"
  host: number
}

type RoomEvent = ChangeRoomSettingsEvent |
    ChangeGameTypeEvent |
    ChangeHostEvent;

export type Event = RoomEvent |
    AuctionTTTEvent;

// The information contained in a packet sent from a viewer
export interface PacketInfo {
  viewer: Viewer
  type: PacketType
  data?: any // if the type is 'action', `data` should be an Action itself
}

// Information about a viewer of a game
export interface Viewer {
  socket: Socket
  index: number
}

export type TeardownCallback = (roomCode: string) => void;

export type ActionCallback = (action: Action) => void;