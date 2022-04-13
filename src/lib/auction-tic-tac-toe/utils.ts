import { Side } from "$lib/auction-tic-tac-toe/types";
import type { Player } from "$lib/auction-tic-tac-toe/types";

export function oppositeSideOf(side: Side): Side {
  return side === Side.X ? Side.O : Side.X;
}

export function winningSide(squares: Side[][]): Side {
  for (const side of [Side.X, Side.O]) {
    for (let i = 0; i < 3; i++) {
      if ((squares[i][0] === side &&
            squares[i][1] === side &&
            squares[i][2] === side) ||
          (squares[0][i] === side &&
            squares[1][i] === side &&
            squares[2][i] === side)) {
        return side;
      }
    }
    if ((squares[0][0] === side &&
          squares[1][1] === side &&
          squares[2][2] === side) ||
        (squares[2][0] === side &&
          squares[1][1] === side &&
          squares[0][2] === side)) {
      return side;
    }
  }
  return Side.None;
}

export function getSideByController(players: Record<Side.X | Side.O, Player>, index: number): Side {
  if (players.X.controller === index) return Side.X;
  if (players.O.controller === index) return Side.O;
  return Side.None;
}

export function getPlayerByController(players: Record<Side.X | Side.O, Player>, index: number): Player | null {
  if (players.X.controller === index) return players[Side.X];
  if (players.O.controller === index) return players[Side.O];
  return null;
}