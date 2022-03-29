import { Side } from "$lib/auction-tic-tac-toe/types";
import type { Player } from "$lib/auction-tic-tac-toe/types";
import type { Viewer } from "$lib/types";

export function oppositeSideOf(side: Side): Side {
  return side === Side.X ? Side.O : Side.X;
}

export function winningSide(squares: Side[][]): Side {
  for (const side of [Side.X, Side.O]) {
    for (let i = 0; i < 3; i++) {
      if ((this.squares[i][0] === side &&
            this.squares[i][1] === side &&
            this.squares[i][2] === side) ||
          (this.squares[0][i] === side &&
            this.squares[1][i] === side &&
            this.squares[2][i] === side)) {
        return side;
      }
    }
    if ((this.squares[0][0] === side &&
          this.squares[1][1] === side &&
          this.squares[2][2] === side) ||
        (this.squares[2][0] === side &&
          this.squares[1][1] === side &&
          this.squares[0][2] === side)) {
      return side;
    }
  }
  return Side.None;
}

export function getPlayerBySide(players: Player[], side: Side): Player | null {
  for (const player of players) {
    if (player.side === side) return player;
  }
  return null;
}

export function getPlayerByController(players: Player[], index: number): Player | null {
  for (const player of players) {
    if (player.controller === index) return player;
  }
  return null;
}