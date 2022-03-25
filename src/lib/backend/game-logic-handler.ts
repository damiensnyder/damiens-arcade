import { PublicRoomInfo, GameType, PublicRoomState, Viewer } from "$lib/types";
import type GameRoom from "./game-room";

export type NoneGameStatus = "pregame";

export interface NonePublicState {
  gameType: GameType.None
  gameStatus: "pregame"
}

export interface Viewpoint extends PublicRoomInfo {
  isHost: boolean
  settings: {
    gameType: GameType.None
  }
}

export default class GameLogicHandler {
  room: GameRoom

  constructor(room: GameRoom) {
    this.room = room;
  }

  handleConnect(viewer: Viewer): void {
    viewer.socket.emit("gamestate", this.publicRoomState());
  }

  handleDisconnect(viewer: Viewer, wasHost: boolean): void {
    if (wasHost) {
      this.emitGamestateToAll();
    }
  }

  handleAction(viewer: Viewer, type: string, data?: any): void {
    if (viewer.index === this.room.host) {
      if (type === "changeGameType") {
        if (data === GameType.AuctionTTT) {
          this.room.changeGameType(GameType.AuctionTTT);
        }
      }
    }
  }

  emitGamestateToAll(): void {
    for (const viewer of this.room.viewers) {
      viewer.socket.emit("gamestate", {
        ...this.room.basicRoomInfo,
        isHost: this.room.host === viewer.index,
        roomState: {
          gameType: GameType.None
        }
      });
    }
  }

  publicRoomState(): PublicRoomState {
    return {
      gameType: GameType.None,
      gameStatus: "pregame"
    };
  }
}