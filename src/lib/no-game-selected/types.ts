import type { BasicViewpointInfo, GameType } from "$lib/types"

export type NoneGameStage = "pregame";

export interface NoneViewpoint extends BasicViewpointInfo {
  gameStage: "pregame"
  gameType: GameType.NoGameSelected
}