import type { Socket } from "socket.io";
import type { AuctionTTTAction, AuctionTTTGameStatus, AuctionTTTPublicState, AuctionTTTViewpoint } from "./auction-tic-tac-toe/types";
import type { NoneGameStatus, NonePublicState, NoneViewpoint } from "./no-game-selected/types";
import type { RoomAction } from "./backend/game-room";

export interface PublicRoomInfo {
  roomName: string
  roomCode: string
  isPrivate: boolean
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

type NotConnectedViewpoint = null;

export type Viewpoint = NotConnectedViewpoint |
    NoneViewpoint |
    AuctionTTTViewpoint;

export type Action = RoomAction |
    AuctionTTTAction;

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