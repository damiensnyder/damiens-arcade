import { writable } from "svelte/store";
import { Side, TurnPart, type AuctionTTTGameStatus, type Player } from "$lib/auction-tic-tac-toe/types";

export const players = writable({
  X: { money: 15 },
  O: { money: 15 }
} as Record<Side.X | Side.O, Player>);
export const turnPart = writable(TurnPart.None);
export const gameStatus = writable("pregame" as AuctionTTTGameStatus);
export const squares = writable([
  [Side.None, Side.None, Side.None],
  [Side.None, Side.None, Side.None],
  [Side.None, Side.None, Side.None]
]);
export const whoseTurnToNominate = writable(Side.None);
export const whoseTurnToBid = writable(Side.None);
export const lastBid = writable(null as number | null);
export const currentlyNominatedSquare = writable(null as [number, number] | null);
export const nominating = writable(null as [number, number] | null);
export const currentBid = writable(null as number | null);
export const settings = writable({
  startingMoney: 15,
  startingPlayer: Side.None
});
export const winner = writable({ winningSide: Side.None });