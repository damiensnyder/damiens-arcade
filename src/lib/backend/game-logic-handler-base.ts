import { GameType, type BasicViewpointInfo, type Event } from "$lib/types";
import type { GameStatus, Viewer, Viewpoint } from "$lib/types";
import type GameRoom from "$lib/backend/game-room";

export default class GameLogicHandlerBase {
  room: GameRoom
  gameStatus: GameStatus

  constructor(room: GameRoom) {
    this.room = room;
    this.gameStatus = "pregame";
  }

  handleConnect(viewer: Viewer): void {
    this.emitGamestateTo(viewer);
  }

  handleDisconnect(_viewer: Viewer, wasHost: boolean): void {
    if (wasHost) {
      this.emitEventToAll({
        type: "changeHost",
        host: this.room.host
      });
    }
  }

  handleAction(_viewer: Viewer, _data?: any): void {}

  emitGamestateTo(viewer: Viewer): void {
    viewer.socket.emit("gamestate", this.viewpointOf(viewer));
  }

  emitEventTo(viewer: Viewer, event: Event): void {
    viewer.socket.emit("event", event);
  }

  emitGamestateToAll(): void {
    for (const viewer of this.room.viewers) {
      this.emitGamestateTo(viewer);
    }
  }

  emitEventToAll(event: Event):void {
    for (const viewer of this.room.viewers) {
      this.emitEventTo(viewer, event);
    }
  }

  viewpointOf(_viewer: Viewer): Viewpoint {
    return null;
  }

  basicViewpointInfo(viewer: Viewer): BasicViewpointInfo {
    return {
      roomCode: this.room.publicRoomInfo.roomCode,
      roomName: this.room.publicRoomInfo.roomName,
      isPublic: this.room.publicRoomInfo.isPublic,
      host: this.room.host,
      pov: viewer.index,
      gameType: GameType.NoGameSelected
    };
  }
}