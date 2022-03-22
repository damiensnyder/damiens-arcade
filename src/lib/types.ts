import type { Socket } from "socket.io";
import type { AuctionTTTPublicState } from "./backend/auction-tic-tac-toe";
import type { NonePublicState } from "./backend/game-room";

export interface BasicRoomInfo {
  roomName: string,
  roomCode: string,
  isPrivate: boolean,
  roomState: PublicRoomState,
  gameStatus: GameStatus
}

export enum GameStatus {
  Pregame = "pregame",
  Midgame = "midgame",
  Postgame = "postgame"
}

export enum GameType {
  None = "[none selected]",
  AuctionTTT = "Auction Tic-Tac-Toe"
}

// The information shown about a game on the join menu
export type PublicRoomState = NonePublicState |
    AuctionTTTPublicState;

// An action taken by a player
export interface Action {
  type: string
  data?: any
}

// The information contained in a packet sent from a viewer
export interface PacketInfo extends Action {
  viewer: Viewer,
  data?: unknown // if the type is 'action', `data` should be an Action itself
}

// Information about a viewer of a game
export interface Viewer {
  socket: Socket,
  index: number
}

export type TeardownCallback = (roomCode: string) => void;