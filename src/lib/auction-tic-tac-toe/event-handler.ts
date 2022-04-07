import type { AuctionTTTEvent, AuctionTTTViewpoint } from "$lib/auction-tic-tac-toe/types";
import { players } from "$lib/auction-tic-tac-toe/stores";

export function handleGamestate(gamestate: AuctionTTTViewpoint) {
  gamestate.settings.startingMoney
}

export function handleEvent(event: AuctionTTTEvent) {
  if (event.type === "join") {
    players.update((p) => {
      p[event.side] = { controller: event.controller, money: -1 };
      return p;
    });
  }
}