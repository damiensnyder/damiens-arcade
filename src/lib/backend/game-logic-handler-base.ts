import { GameType, type BasicViewpointInfo } from "$lib/types";
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
      this.emitGamestateToAll();
    }
  }

  handleAction(_viewer: Viewer, _data?: any): void {}

  emitGamestateTo(viewer: Viewer): void {
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