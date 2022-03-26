import { GameType } from "$lib/types";
import type { GameStatus, PublicRoomState, Viewer, Viewpoint } from "$lib/types";
import GameLogicHandlerBase from "../backend/game-logic-handler-base";
import type GameRoom from "../backend/game-room";

export interface NonePublicState {
  gameType: GameType.NoGameSelected
  gameStatus: "pregame"
}

export interface NoneViewpoint {
  roomCode: string
  roomName: string
  isPrivate: boolean
  isHost: boolean
  gameStatus: "pregame"
  gameType: GameType.NoGameSelected
}

export default class NoGameSelected extends GameLogicHandlerBase {
  room: GameRoom
  gameStatus: GameStatus

  constructor(room: GameRoom) {
    super(room);
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
    viewer.socket.emit("gamestate", this.viewpointOf(viewer));
  }

  emitGamestateToAll(): void {
    for (const viewer of this.room.viewers) {
      this.emitGamestateTo(viewer);
    }
  }

  viewpointOf(viewer: Viewer): NoneViewpoint {
    return {
      roomCode: this.room.basicRoomInfo.roomCode,
      roomName: this.room.basicRoomInfo.roomName,
      isPrivate: this.room.basicRoomInfo.isPrivate,
      isHost: this.room.host === viewer.index,
      gameStatus: "pregame",
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