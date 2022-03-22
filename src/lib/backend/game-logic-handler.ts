import { GameType, PublicRoomState } from "$lib/types";
import type GameRoom from "./game-room";

export interface NonePublicState {
  gameType: GameType.None
}

export default class GameLogicHandler {
  room: GameRoom

  constructor(room: GameRoom) {
    this.room = room;
  }

  handlePacket(viewerIndex: number, data?: unknown): void {

  }

  basicRoomInfo(): PublicRoomState {
    return {
      gameType: GameType.None
    };
  }
}