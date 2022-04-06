import { GameType, type BasicViewpointInfo, type Event } from "$lib/types";
import type { GameStatus, PublicRoomState, Viewer, Viewpoint } from "$lib/types";
import type GameRoom from "$lib/backend/game-room";

export default class GameLogicHandlerBase {
  room: GameRoom
  gameStatus: GameStatus
  gameType: GameType

  constructor(room: GameRoom) {
    this.room = room;
    this.gameStatus = "pregame";
    this.gameType = this.room.basicRoomInfo.roomState.gameType;
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

  emitEventTo(viewer: Viewer, event: Event):void {
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
      roomCode: this.room.basicRoomInfo.roomCode,
      roomName: this.room.basicRoomInfo.roomName,
      isPublic: this.room.basicRoomInfo.isPublic,
      host: this.room.host,
      pov: viewer.index,
      connected: true,
      gameType: GameType.NoGameSelected
    };
  }

  publicRoomState(): PublicRoomState {
    return {
      gameType: GameType.NoGameSelected,
      gameStatus: "pregame"
    };
  }
}