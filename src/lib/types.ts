import type { Socket } from "socket.io";
import type { AuctionTTTGameStatus, AuctionTTTPublicState } from "./backend/auction-tic-tac-toe";
import type { NoneGameStatus, NonePublicState } from "./backend/game-logic-handler";

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
  None = "[none selected]",
  AuctionTTT = "Auction Tic-Tac-Toe"
}

// The information shown about a game on the join menu
export type PublicRoomState = NonePublicState |
    AuctionTTTPublicState;

export type GameStatus = NoneGameStatus |
    AuctionTTTGameStatus;

// An action taken by a player
export interface Action {
  type: string
  data?: any
}

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