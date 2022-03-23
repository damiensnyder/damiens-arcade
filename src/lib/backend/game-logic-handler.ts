import { GameStatus, GameType, PublicRoomState } from "$lib/types";
import type GameRoom from "./game-room";

export interface NonePublicState {
  gameType: GameType.None
}

export interface Viewpoint {
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

  handlePacket(viewerIndex: number, type: string, data?: unknown): void {
    
  }

  publicRoomState(): PublicRoomState {
    return {
      gameType: GameType.None
    };
  }
}