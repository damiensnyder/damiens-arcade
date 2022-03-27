import { GameType } from "$lib/types";
import type { GameStatus, PublicRoomState, Viewer } from "$lib/types";
import type { NoneViewpoint } from "$lib/no-game-selected/types";
import GameLogicHandlerBase from "$lib/backend/game-logic-handler-base";
import type GameRoom from "$lib/backend/game-room";

export interface NonePublicState {
  gameType: GameType.NoGameSelected
  gameStatus: "pregame"
}

export default class NoGameSelected extends GameLogicHandlerBase {
  room: GameRoom
  gameStatus: GameStatus

  constructor(room: GameRoom) {
    super(room);
    this.room = room;
    this.gameStatus = "pregame";
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
      ...this.basicViewpointInfo(viewer),
      gameType: GameType.NoGameSelected,
      gameStatus: "pregame"
    };
  }

  publicRoomState(): PublicRoomState {
    return {
      gameType: GameType.NoGameSelected,
      gameStatus: "pregame"
    };
  }
}