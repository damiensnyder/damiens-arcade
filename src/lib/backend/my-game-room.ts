import type { Gamestate, RoomSettings, TeardownCallback, Viewpoint } from "$lib/types";
import type { Server } from "socket.io";
import GameRoom from "./game-room";

export interface MyGameViewpoint extends Viewpoint {}

export interface MyGamestate extends MyGameViewpoint, Gamestate {}

export default class MyGameRoom extends GameRoom {
  gamestate: MyGamestate;

  constructor(
    io: Server,
    roomSettings: RoomSettings,
    teardownCallback: TeardownCallback
  ) {
    super(io, roomSettings, teardownCallback);
  }

  // Handles an action's game logic.
  handleGameAction(_pov: number, _data: unknown) {}

  // Returns the viewpoint of the viewer with the given POV.
  generateViewpoint(_pov: number): Viewpoint {
    return {
      players: this.gamestate.players,
      ...this.roomSettings
    };
  }
}