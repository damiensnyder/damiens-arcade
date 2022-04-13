import { TurnPart, type AuctionTTTEvent, type AuctionTTTViewpoint } from "$lib/auction-tic-tac-toe/types";
import { currentBid, gameStatus, lastBid, players, settings, turnPart, whoseTurnToBid, whoseTurnToNominate, winner } from "$lib/auction-tic-tac-toe/stores";
import { oppositeSideOf } from "$lib/auction-tic-tac-toe/utils";
import { get } from "svelte/store";

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
    turnPart.set(TurnPart.Nominating);
  } else if (event.type === "gameOver") {
    gameStatus.set("postgame");
    turnPart.set(TurnPart.None);
    winner.set(event.winner);
  } else if (event.type === "leave") {
    players.update((p) => {
      delete p[event.side].controller;
      return p;
    })
  } else if (event.type === "nominate") {
    whoseTurnToBid.set(oppositeSideOf(get(whoseTurnToNominate)));
    turnPart.set(TurnPart.Bidding);
  } else if (event.type === "pass") {
    // do nothing as of now
  } else if (event.type === "replace") {
    players.update((old) => {
      old[event.side].controller = event.controller;
      return old;
    });
  } else if (event.type === "start") {
    whoseTurnToNominate.set(event.startingPlayer);
    turnPart.set(TurnPart.Nominating);
    players.update((old) => {
      old.X.money = get(settings).startingMoney;
      old.O.money = get(settings).startingMoney;
      return old;
    })
  }
}