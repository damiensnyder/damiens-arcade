import { writable } from "svelte/store";
import { Side, TurnPart, type Player } from "$lib/auction-tic-tac-toe/types";

export const players = writable({
  X: { money: 15 },
  O: { money: 15 }
} as Record<Side, Player>);
export const turnPart = writable(TurnPart.None);
export const gameStatus = writable("pregame");
export const whoseTurnToNominate = writable(Side.None);
export const whoseTurnToBid = writable(Side.None);
export const lastBid = writable(0);
export const squares = writable([
  [Side.None, Side.None, Side.None],
  [Side.None, Side.None, Side.None],
  [Side.None, Side.None, Side.None]
]);
export const currentlyNominatedSquare = writable([0, 0]);
export const nominating = writable([0, 0]);
export const currentBid = writable(0);