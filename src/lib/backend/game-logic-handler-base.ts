import { GameType, type BasicViewpointInfo, type Event } from "$lib/types";
import type { GameStage, Viewer, Viewpoint } from "$lib/types";
import type GameRoom from "$lib/backend/game-room";

export default class GameLogicHandlerBase {
  room: GameRoom
  gameStage: GameStage
  rngState: [number, number, number, number]

  constructor(room: GameRoom) {
    this.room = room;
    this.gameStage = "pregame";
    this.rngState = room.seed;
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

  emitEventToAll(event: Event): void {
    for (const viewer of this.room.viewers) {
      this.emitEventTo(viewer, event);
    }
  }

  // Generates random integers between min and max, inclusive, using jsf32b PRNG
  randInt(min: number, max: number): number {
    this.rngState[0] |= 0;
    this.rngState[1] |= 0;
    this.rngState[2] |= 0;
    this.rngState[3] |= 0;
    const t = this.rngState[0] - (this.rngState[1] << 23 | this.rngState[1] >>> 9) | 0;
    this.rngState[0] = this.rngState[1] ^ (this.rngState[2] << 16 | this.rngState[2] >>> 16) | 0;
    this.rngState[1] = this.rngState[2] + (this.rngState[3] << 11 | this.rngState[3] >>> 21) | 0;
    this.rngState[1] = this.rngState[2] + this.rngState[3] | 0x0;
    this.rngState[2] = this.rngState[3] + t | 0x0;
    this.rngState[3] = this.rngState[0] + t | 0x0;
    return min + Math.floor((max + 1 - min) * (this.rngState[3] >>> 0) / 4294967296);
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