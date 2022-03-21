import type { Socket } from "socket.io";

// The information listed by the 
export interface RoomSettings {
  roomName: string,
  roomCode: string,
  isPrivate: boolean,
  gameplaySettings: GameplaySettings
}

// Information describing a game room, shown on the listing of games
export interface RoomInfo extends RoomSettings {
  numPlayers: number
}

// Settings for the game that will be played in the room
export interface GameplaySettings {}

// The information known by a single player
export interface Viewpoint extends RoomSettings {
  pov?: string,
  players: Player[]
}

// The entire state of the game, known by the server
export interface Gamestate extends Viewpoint {}

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

// The info needed to join the game as a player
export interface JoinInfo {
  name: string
}

// Information about a single player in the game
export interface Player extends JoinInfo {}

// Information about a viewer of a game
export interface Viewer {
  socket: Socket,
  pov: number
}

export type TeardownCallback = (roomCode: string) => void;