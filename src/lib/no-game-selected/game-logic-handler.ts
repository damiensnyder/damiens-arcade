import { GameType } from "$lib/types";
import type { GameStatus, Viewer } from "$lib/types";
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

  viewpointOf(viewer: Viewer): NoneViewpoint {
    return {
      ...this.basicViewpointInfo(viewer),
      gameType: GameType.NoGameSelected,
      gameStatus: "pregame"
    };
  }
}