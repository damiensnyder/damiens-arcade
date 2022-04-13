import { Side, TurnPart, type AuctionTTTEvent, type AuctionTTTViewpoint } from "$lib/auction-tic-tac-toe/types";
import { currentBid, currentlyNominatedSquare, gameStatus, nominating, lastBid, players, settings, squares, turnPart, whoseTurnToBid, whoseTurnToNominate } from "$lib/auction-tic-tac-toe/stores";
import { oppositeSideOf } from "$lib/auction-tic-tac-toe/utils";
import { get } from "svelte/store";

export function switchToType(): void {
  settings.set({ startingMoney: 15, startingPlayer: Side.None });
  gameStatus.set("pregame");
  players.set({ X: { money: -1 }, O: { money: -1 } });
}

export function handleGamestate(gamestate: AuctionTTTViewpoint): void {
  settings.set(gamestate.settings);
  gameStatus.set(gamestate.gameStatus);
  players.set(gamestate.players);
  if (gamestate.gameStatus === "midgame") {
    squares.set(gamestate.squares);
    whoseTurnToNominate.set(gamestate.whoseTurnToNominate);
    turnPart.set(gamestate.turnPart);
    if (gamestate.turnPart === TurnPart.Bidding) {
      currentlyNominatedSquare.set(gamestate.currentlyNominatedSquare);
      lastBid.set(gamestate.lastBid);
      whoseTurnToBid.set(gamestate.whoseTurnToBid);
    }
  }
}

export function handleEvent(event: AuctionTTTEvent): void {
  if (event.type === "join") {
    players.update((old) => {
      old[event.side] = { controller: event.controller, money: -1 };
      return old;
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
    players.update((old) => {
      old[oppositeSideOf(get(whoseTurnToBid))].money -= get(lastBid);
      return old;
    })
    squares.update((old) => {
      old[get(currentlyNominatedSquare)[0]][get(currentlyNominatedSquare)[1]] = event.side;
      return old;
    })
    currentlyNominatedSquare.set([-1, -1]);
    turnPart.set(TurnPart.Nominating);
  } else if (event.type === "gameOver") {
    gameStatus.set("postgame");
    turnPart.set(TurnPart.None);
  } else if (event.type === "leave") {
    players.update((old) => {
      delete old[event.side].controller;
      return old;
    })
  } else if (event.type === "nominate") {
    whoseTurnToBid.set(oppositeSideOf(get(whoseTurnToNominate)));
    currentlyNominatedSquare.set(event.square);
    turnPart.set(TurnPart.Bidding);
    lastBid.set(event.startingBid);
    currentBid.set(event.startingBid + 1);
    nominating.set(null);
  } else if (event.type === "pass") {
    // do nothing as of now
  } else if (event.type === "replace") {
    players.update((old) => {
      old[event.side].controller = event.controller;
      return old;
    });
    currentBid.set(get(lastBid) + 1);
  } else if (event.type === "start") {
    whoseTurnToNominate.set(event.startingPlayer);
    turnPart.set(TurnPart.Nominating);
    players.update((old) => {
      old.X.money = get(settings).startingMoney;
      old.O.money = get(settings).startingMoney;
      return old;
    });
    gameStatus.set("midgame");
    squares.set([
      [Side.None, Side.None, Side.None],
      [Side.None, Side.None, Side.None],
      [Side.None, Side.None, Side.None]
    ]);
  }
}