import { Side, TurnPart, type AuctionTTTEvent, type AuctionTTTViewpoint } from "$lib/auction-tic-tac-toe/types";
import { currentBid, currentlyNominatedSquare, gameStatus, nominating, lastBid, players, settings, squares, turnPart, whoseTurnToBid, whoseTurnToNominate, winner, timeOfLastMove } from "$lib/auction-tic-tac-toe/stores";
import { oppositeSideOf } from "$lib/auction-tic-tac-toe/utils";
import { get } from "svelte/store";
import { eventLog, pov } from "$lib/stores";

export function switchToType(): void {
  settings.set({
    startingMoney: 15,
    startingPlayer: Side.None,
    useTiebreaker: false
  });
  gameStatus.set("pregame");
  players.set({ X: { money: 15 }, O: { money: 15 } });
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
    if (gamestate.settings.useTiebreaker) {
      timeOfLastMove.set(gamestate.timeOfLastMove);
      startTimer();
    }
  } else if (gamestate.gameStatus === "postgame") {
    squares.set(gamestate.squares);
    turnPart.set(TurnPart.None);
    winner.set(gamestate.winner);
  }
}

type AuctionTTTEventHandler = {
  [key in AuctionTTTEvent["type"]]: (event: AuctionTTTEvent & { type: key }) => void;
};

export const eventHandler: AuctionTTTEventHandler = {
  join: function (event): void {
    players.update((old) => {
      old[event.side].controller = event.controller;
      return old;
    });
    if (get(pov) === event.controller && get(lastBid) !== null) {
      currentBid.set(get(lastBid) + 1);
    }
    eventLog.append(`A player has joined as ${event.side}.`);
  },
  leave: function (event): void {
    players.update((old) => {
      delete old[event.side].controller;
      return old;
    });
    eventLog.append(`The player playing ${event.side} has left.`);
  },
  changeGameSettings: function (event): void {
    settings.set(event.settings);
  },
  start: function (event): void {
    whoseTurnToNominate.set(event.startingPlayer);
    turnPart.set(TurnPart.Nominating);
    players.update((old) => {
      old.X.money = get(settings).startingMoney;
      old.O.money = get(settings).startingMoney;
      if (get(settings).useTiebreaker) {
        timeOfLastMove.set(new Date().getTime());
        old.X.timeUsed = 0;
        old.O.timeUsed = 0;
        startTimer();
      }
      return old;
    });
    if (get(gameStatus) === "pregame") {
      eventLog.append("The game has started.");
    } else {
      eventLog.append("A new game has started.");
    }
    gameStatus.set("midgame");
    squares.set([
      [Side.None, Side.None, Side.None],
      [Side.None, Side.None, Side.None],
      [Side.None, Side.None, Side.None]
    ]);
  },
  timing: function (event): void {
    players.update((old) => {
      old.X.timeUsed = event.X;
      old.O.timeUsed = event.O;
      return old;
    });
    timeOfLastMove.set(event.timeOfLastMove);
  },
  nominate: function (event): void {
    eventLog.append(`${get(whoseTurnToNominate)} nominated a square with a starting bid of $${event.startingBid}.`)
    whoseTurnToBid.set(oppositeSideOf(get(whoseTurnToNominate)));
    currentlyNominatedSquare.set(event.square);
    turnPart.set(TurnPart.Bidding);
    lastBid.set(event.startingBid);
    currentBid.set(event.startingBid + 1);
    nominating.set(null);
  },
  bid: function (event): void {
    lastBid.set(event.amount);
    currentBid.set(event.amount + 1);
    const lastBidder = get(whoseTurnToBid);
    whoseTurnToBid.set(oppositeSideOf(lastBidder));
    eventLog.append(`${lastBidder} bid $${event.amount}.`)
  },
  pass: function (_event): void {
    eventLog.append(`${get(whoseTurnToBid)} passed.`);
  },
  awardSquare: function (event): void {
    whoseTurnToNominate.update((lastNominater) => oppositeSideOf(lastNominater));
    const whoWonTheSquare = oppositeSideOf(get(whoseTurnToBid))
    players.update((old) => {
      old[whoWonTheSquare].money -= get(lastBid);
      return old;
    })
    squares.update((old) => {
      old[get(currentlyNominatedSquare)[0]][get(currentlyNominatedSquare)[1]] = event.side;
      return old;
    })
    currentlyNominatedSquare.set([-1, -1]);
    turnPart.set(TurnPart.Nominating);
    eventLog.append(`The square has been awarded to ${whoWonTheSquare}.`);
  },
  gameOver: function (event): void {
    gameStatus.set("postgame");
    turnPart.set(TurnPart.None);
    delete event.type;
    winner.set(event);
    if (event.winningSide === Side.None) {
      eventLog.append(`The game is a tie!`);
    } else {
      eventLog.append(`${event.winningSide} has won the game!`);
    }
    if (get(settings).useTiebreaker) {
      stopTimer();
    }
  },
  backToSettings: function (_event): void {
    gameStatus.set("pregame");
  }
}

let timer;

function startTimer(): void {
  timer = setInterval(() => {
    const prevTime = get(timeOfLastMove);
    const newTime = new Date().getTime();
    timeOfLastMove.set(newTime);
    const whoseTurnItIs = get(turnPart) === TurnPart.Bidding ?
        get(whoseTurnToBid) : get(whoseTurnToNominate);
    players.update((old) => {
      old[whoseTurnItIs].timeUsed += newTime - prevTime;
      return old;
    });
  }, 1000);
}

function stopTimer(): void {
  clearInterval(timer);
}