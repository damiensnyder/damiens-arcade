import { GameStatus, GameType, PublicRoomState, Viewer, Viewpoint } from "$lib/types";
import type GameRoom from "./game-room";

export default class GameLogicHandlerBase {
  room: GameRoom
  gameStatus: GameStatus

  constructor(room: GameRoom) {
    this.room = room;
    this.gameStatus = "pregame";
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

  handleAction(_viewer: Viewer, _data?: any): void {}

  emitGamestateTo(viewer: Viewer): void {
    console.debug(this.viewpointOf(viewer));
    viewer.socket.emit("gamestate", this.viewpointOf(viewer));
  }

  emitGamestateToAll(): void {
    for (const viewer of this.room.viewers) {
      this.emitGamestateTo(viewer);
    }
  }

  viewpointOf(_viewer: Viewer): Viewpoint {
    return null;
  }

  publicRoomState(): PublicRoomState {
    return {
      gameType: GameType.NoGameSelected,
      gameStatus: "pregame"
    };
  }
}