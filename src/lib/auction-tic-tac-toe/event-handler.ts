import type { AuctionTTTEvent, AuctionTTTViewpoint } from "$lib/auction-tic-tac-toe/types";
import { currentBid, gameStatus, lastBid, players, settings, whoseTurnToBid, whoseTurnToNominate } from "$lib/auction-tic-tac-toe/stores";
import { oppositeSideOf } from "$lib/auction-tic-tac-toe/utils";

export function handleGamestate(gamestate: AuctionTTTViewpoint) {
  gamestate.settings.startingMoney
}

export function handleEvent(event: AuctionTTTEvent) {
  if (event.type === "join") {
    players.update((p) => {
      p[event.side] = { controller: event.controller, money: -1 };
      return p;
    });
  } else if (event.type === "backToSettings") {
    gameStatus.set("pregame");
  } else if (event.type === "changeGameSettings") {
    settings.set(event.settings);
  } else if (event.type === "bid") {
    lastBid.set(event.amount);
    currentBid.set(event.amount + 1);
    whoseTurnToBid.update((lastBidder) => oppositeSideOf(lastBidder));
  } else if (event.type === "awardSquare") {
    whoseTurnToNominate.update((lastNominater) => oppositeSideOf(lastNominater));
  }
}