import { BasicRoomInfo, GameStatus, GameType, PacketType, PublicRoomState } from "$lib/types";
import type GameRoom from "./game-room";

export interface NonePublicState {
  gameType: GameType.None
}

export interface Viewpoint extends BasicRoomInfo {
  gameStatus: GameStatus.Pregame
  settings: {
    gameType: GameType.None
  }
}

export default class GameLogicHandler {
  room: GameRoom

  constructor(room: GameRoom) {
    this.room = room;
  }

  handlePacket(viewerIndex: number, type: PacketType, data?: unknown): void {
    if (type === PacketType.Connect) {
      this.room.viewers[viewerIndex].socket.emit("gamestate", this.publicRoomState());
      if (viewerIndex === 0) {
        this.room.viewers[viewerIndex].
      }
    } else if (type === PacketType.Disconnect) {

    }
  }

  publicRoomState(): PublicRoomState {
    return {
      gameType: GameType.None
    };
  }
}