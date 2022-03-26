import type { GameType } from "$lib/types"

export type NoneGameStatus = "pregame";

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