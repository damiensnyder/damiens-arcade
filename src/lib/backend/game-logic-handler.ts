import { PublicRoomInfo, GameType, PublicRoomState, Viewer } from "$lib/types";
import type GameRoom from "./game-room";

export type NoneGameStatus = "pregame";

export interface NonePublicState {
  gameType: GameType.None
  gameStatus: "pregame"
}

export default class GameLogicHandler {
  room: GameRoom

  constructor(room: GameRoom) {
    this.room = room;
    this.emitGamestateToAll();
  }

  handleConnect(viewer: Viewer): void {
    this.emitGamestateTo(viewer);
  }

  handleDisconnect(_viewer: Viewer, wasHost: boolean): void {
    if (wasHost) {
      this.emitGamestateToAll();
    }
  }

  handleAction(viewer: Viewer, data?: any): void {}

  emitGamestateTo(viewer: Viewer): void {
    viewer.socket.emit("gamestate", this.viewpointOf(viewer));
  }

  emitGamestateToAll(): void {
    for (const viewer of this.room.viewers) {
      this.emitGamestateTo(viewer);
    }
  }

  viewpointOf(viewer: Viewer) {
    return {
      roomCode: this.room.basicRoomInfo.roomCode,
      roomName: this.room.basicRoomInfo.roomName,
      isPrivate: this.room.basicRoomInfo.isPrivate,
      isHost: this.room.host === viewer.index,
      settings: {
        gameType: GameType.None
      }
    };
  }

  publicRoomState(): PublicRoomState {
    return {
      gameType: GameType.None,
      gameStatus: "pregame"
    };
  }
}