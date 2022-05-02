import { GameType } from "$lib/types";
import type { GameStage, Viewer } from "$lib/types";
import type { NoneViewpoint } from "$lib/no-game-selected/types";
import GameLogicHandlerBase from "$lib/backend/game-logic-handler-base";
import type GameRoom from "$lib/backend/game-room";

export default class NoGameSelected extends GameLogicHandlerBase {
  room: GameRoom
  gameStage: GameStage

  constructor(room: GameRoom) {
    super(room);
    this.room = room;
    this.gameStage = "pregame";
  }

  viewpointOf(viewer: Viewer): NoneViewpoint {
    return {
      ...this.basicViewpointInfo(viewer),
      gameType: GameType.NoGameSelected,
      gameStage: "pregame"
    };
  }
}