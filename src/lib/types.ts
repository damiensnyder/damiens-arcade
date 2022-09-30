import type { Socket } from "socket.io";
import type { AuctionTTTGameStage } from "$lib/auction-tic-tac-toe/types";
import type { TestRoomAction } from "$lib/test/set-up-test-rooms";
import type { TourneyGameStage } from "$lib/tourney/types";

export interface PublicRoomInfo {
  roomName: string
  roomCode: string
  isPublic: boolean
  gameType: GameType
  gameStage: GameStage
}

export enum PacketType {
  Connect = "connect",
  Disconnect = "disconnect",
  Action = "action"
}

export enum GameType {
  AuctionTTT = "auction-tic-tac-toe",
  MayhemManager = "mayhem-manager"
}

export type GameStage = AuctionTTTGameStage |
    TourneyGameStage;

export interface BasicViewpointInfo {
  roomCode: string
  roomName: string
  isPublic: boolean
  host: number
  pov: number
}

export interface ChangeRoomSettingsAction {
  type: "changeRoomSettings"
  roomName: string
  isPublic: boolean
}

export interface ChangeRoomSettingsEvent {
  type: "changeRoomSettings"
  roomName: string
  isPublic: boolean
}

export interface ChangeHostEvent {
  type: "changeHost"
  host: number
}

export type RoomEvent = ChangeRoomSettingsEvent |
    ChangeHostEvent;

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

export type ActionCallback<T> = (action: T) => void;

export type EventHandler<T extends { type: string }> = {
  [key in T["type"]]: (event: T & { type: key }) => void;
};

export interface RNG {
  randInt: (min: number, max: number) => number
  randReal: () => number
  randElement: <T>(arr: T[]) => T
}