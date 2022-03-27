import type { BasicViewpointInfo, GameType } from "$lib/types"

export type NoneGameStatus = "pregame";

export interface NonePublicState {
  gameType: GameType.NoGameSelected
  gameStatus: "pregame"
}

export interface NoneViewpoint extends BasicViewpointInfo {
  gameStatus: "pregame"
  gameType: GameType.NoGameSelected
}