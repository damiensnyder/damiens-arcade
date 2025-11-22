import { Z as store_get, V as head, Y as attr_class, W as ensure_array_like, X as attr, _ as unsubscribe_stores } from './index2-w53_U3TB.js';
import { e as escape_html, c as ssr_context, g as getContext } from './context-DDZhjpoT.js';
import './exports-CgQJUv15.js';
import './state.svelte-ClWQPWuE.js';
import { S as Side, T as TurnPart } from './types-DqNVlIiB.js';

function onDestroy(fn) {
  /** @type {SSRContext} */
  ssr_context.r.on_destroy(fn);
}
const getStores = () => {
  const stores$1 = getContext("__svelte__");
  return {
    /** @type {typeof page} */
    page: {
      subscribe: stores$1.page.subscribe
    },
    /** @type {typeof navigating} */
    navigating: {
      subscribe: stores$1.navigating.subscribe
    },
    /** @type {typeof updated} */
    updated: stores$1.updated
  };
};
const page = {
  subscribe(fn) {
    const store = getStores().page;
    return store.subscribe(fn);
  }
};
class GameConnection {
  constructor(gameType, roomCode, onEvent) {
    this.gameType = gameType;
    this.roomCode = roomCode;
    this.onEvent = onEvent;
  }
  socket = null;
  reconnectAttempts = 0;
  maxReconnectAttempts = 10;
  connected = false;
  error = null;
  gameState = null;
  eventLog = [];
  connect() {
    const wsUrl = `wss://${window.location.host}/ws/${this.gameType}/${this.roomCode}`;
    this.socket = new WebSocket(wsUrl);
    this.socket.addEventListener("open", () => {
      this.connected = true;
      this.error = null;
      this.reconnectAttempts = 0;
      this.addToLog("Connected to game");
    });
    this.socket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      switch (message.type) {
        case "gamestate":
          this.gameState = message.data;
          break;
        case "event":
          this.onEvent(message.event);
          break;
        case "error":
          this.error = message.message;
          this.addToLog(`Error: ${message.message}`);
          break;
      }
    });
    this.socket.addEventListener("close", () => {
      this.connected = false;
      this.addToLog("Disconnected from game");
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        const delay = Math.min(1e3 * Math.pow(2, this.reconnectAttempts), 1e4);
        setTimeout(() => this.connect(), delay);
      }
    });
    this.socket.addEventListener("error", (err) => {
      console.error("WebSocket error:", err);
      this.error = "Connection error";
    });
  }
  sendAction(action) {
    if (!this.socket || !this.connected) {
      console.warn("Cannot send action: not connected");
      return;
    }
    this.socket.send(JSON.stringify({ type: "action", action }));
  }
  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
  addToLog(message) {
    this.eventLog = [...this.eventLog, message];
  }
}
function oppositeSideOf(side) {
  return side === Side.X ? Side.O : Side.X;
}
class AuctionTTTState {
  connection;
  // Local UI state
  currentBid = null;
  nominating = null;
  constructor(roomCode) {
    this.connection = new GameConnection("auction-ttt", roomCode, (event) => this.applyEvent(event));
  }
  // Computed properties
  get state() {
    return this.connection.gameState;
  }
  get connected() {
    return this.connection.connected;
  }
  get eventLog() {
    return this.connection.eventLog;
  }
  get myPlayer() {
    if (!this.state || this.state.gameStage === "pregame") return null;
    const pov = this.state.pov;
    if (this.state.players.X.controller === pov) return this.state.players.X;
    if (this.state.players.O.controller === pov) return this.state.players.O;
    return null;
  }
  get mySide() {
    if (!this.state) return Side.None;
    const pov = this.state.pov;
    if (this.state.players.X.controller === pov) return Side.X;
    if (this.state.players.O.controller === pov) return Side.O;
    return Side.None;
  }
  get isMyTurn() {
    if (!this.state || this.state.gameStage !== "midgame") return false;
    const mySide = this.mySide;
    if (mySide === Side.None) return false;
    if (this.state.turnPart === TurnPart.Nominating) {
      return this.state.whoseTurnToNominate === mySide;
    } else if (this.state.turnPart === TurnPart.Bidding) {
      return this.state.whoseTurnToBid === mySide;
    }
    return false;
  }
  // Actions
  connect() {
    this.connection.connect();
  }
  disconnect() {
    this.connection.disconnect();
  }
  sendAction(action) {
    this.connection.sendAction(action);
  }
  // Event handling
  applyEvent(event) {
    const state = this.state;
    if (!state) return;
    switch (event.type) {
      case "changeRoomSettings":
        state.roomName = event.roomName;
        state.isPublic = event.isPublic;
        break;
      case "changeHost":
        state.host = event.host;
        if (event.host === state.pov) {
          this.connection.addToLog("You are now the host");
        }
        break;
      case "changeGameSettings":
        if (state.gameStage === "pregame") {
          state.settings = event.settings;
        }
        break;
      case "join":
        state.players[event.side].controller = event.controller;
        this.connection.addToLog(`A player has joined as ${event.side}`);
        if (state.gameStage === "midgame" && state.lastBid !== void 0) {
          this.currentBid = state.lastBid + 1;
        }
        break;
      case "leave":
        delete state.players[event.side].controller;
        this.connection.addToLog(`The player playing ${event.side} has left`);
        break;
      case "start":
        if (state.gameStage === "pregame") {
          this.connection.addToLog("The game has started");
        } else {
          this.connection.addToLog("A new game has started");
        }
        break;
      case "timing":
        if (state.gameStage === "midgame") {
          state.players.X.timeUsed = event.X;
          state.players.O.timeUsed = event.O;
          state.timeOfLastMove = event.timeOfLastMove;
        }
        break;
      case "nominate":
        if (state.gameStage === "midgame") {
          const nominator = state.whoseTurnToNominate;
          this.connection.addToLog(`${nominator} nominated a square with a starting bid of $${event.startingBid}`);
          this.nominating = null;
          this.currentBid = event.startingBid + 1;
        }
        break;
      case "bid":
        if (state.gameStage === "midgame" && state.whoseTurnToBid) {
          const bidder = oppositeSideOf(state.whoseTurnToBid);
          this.connection.addToLog(`${bidder} bid $${event.amount}`);
          this.currentBid = event.amount + 1;
        }
        break;
      case "pass":
        if (state.gameStage === "midgame" && state.whoseTurnToBid) {
          this.connection.addToLog(`${state.whoseTurnToBid} passed`);
        }
        break;
      case "awardSquare":
        if (state.gameStage === "midgame") {
          this.connection.addToLog(`The square has been awarded to ${event.side}`);
        }
        break;
      case "gameOver":
        if (event.winningSide === Side.None) {
          this.connection.addToLog("The game is a tie!");
        } else {
          this.connection.addToLog(`${event.winningSide} has won the game!`);
        }
        break;
      case "backToSettings":
        this.connection.addToLog("Returning to settings");
        break;
    }
  }
}
function X($$renderer, $$props) {
  let { size } = $$props;
  let strokeWidth = 200 / size;
  $$renderer.push(`<svg${attr("width", size)}${attr("height", size)} viewBox="-5 -5 110 110"><line x1="0" y1="0" x2="100" y2="100" stroke="#f6a"${attr("stroke-width", strokeWidth)}></line><line x1="100" y1="0" x2="0" y2="100" stroke="#f6a"${attr("stroke-width", strokeWidth)}></line></svg>`);
}
function O($$renderer, $$props) {
  let { size } = $$props;
  let strokeWidth = 200 / size;
  $$renderer.push(`<svg${attr("width", size)}${attr("height", size)} viewBox="-5 -5 110 110"><circle cx="50" cy="50" r="50" stroke="#6df"${attr("stroke-width", strokeWidth)} fill="transparent"></circle></svg>`);
}
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    const roomCode = store_get($$store_subs ??= {}, "$page", page).params.roomCode.toUpperCase();
    const gameState = new AuctionTTTState(roomCode);
    onDestroy(() => {
      gameState.disconnect();
    });
    function millisToMinutesAndSeconds(timeInMillis) {
      const asDate = new Date(Date.UTC(0, 0, 0, 0, 0, 0, timeInMillis));
      return `${asDate.getUTCMinutes()}:${String(asDate.getUTCSeconds()).padStart(2, "0")}`;
    }
    head("1y3eif9", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>Auction Tic-Tac-Toe | ${escape_html(roomCode)}</title>`);
      });
    });
    if (!gameState.connected) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="center-on-page svelte-1y3eif9"><p>Connecting to room ${escape_html(roomCode)}...</p></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
      if (!gameState.state) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<div class="center-on-page svelte-1y3eif9"><p>Loading game state...</p></div>`);
      } else {
        $$renderer2.push("<!--[!-->");
        const state = gameState.state;
        if (state.gameStage === "pregame") {
          $$renderer2.push("<!--[-->");
          $$renderer2.push(`<h1>Damien's Arcade</h1> <div class="top-level-menu svelte-1y3eif9"><div><h3>Room Settings</h3> <p>Room: ${escape_html(state.roomName)} (${escape_html(state.roomCode)})</p> <p>You are: ${escape_html(state.pov === state.host ? "Host" : "Guest")}</p></div> <div class="player-selection svelte-1y3eif9"><div class="player-slot svelte-1y3eif9">`);
          X($$renderer2, { size: 80 });
          $$renderer2.push(`<!----> `);
          if (state.players.X.controller !== void 0) {
            $$renderer2.push("<!--[-->");
            $$renderer2.push(`<p>Player joined</p> `);
            if (gameState.mySide === Side.X) {
              $$renderer2.push("<!--[-->");
              $$renderer2.push(`<button>LEAVE</button>`);
            } else {
              $$renderer2.push("<!--[!-->");
            }
            $$renderer2.push(`<!--]-->`);
          } else {
            $$renderer2.push("<!--[!-->");
            $$renderer2.push(`<button>JOIN AS X</button>`);
          }
          $$renderer2.push(`<!--]--></div> <div class="player-slot svelte-1y3eif9">`);
          O($$renderer2, { size: 80 });
          $$renderer2.push(`<!----> `);
          if (state.players.O.controller !== void 0) {
            $$renderer2.push("<!--[-->");
            $$renderer2.push(`<p>Player joined</p> `);
            if (gameState.mySide === Side.O) {
              $$renderer2.push("<!--[-->");
              $$renderer2.push(`<button>LEAVE</button>`);
            } else {
              $$renderer2.push("<!--[!-->");
            }
            $$renderer2.push(`<!--]-->`);
          } else {
            $$renderer2.push("<!--[!-->");
            $$renderer2.push(`<button>JOIN AS O</button>`);
          }
          $$renderer2.push(`<!--]--></div></div> `);
          if (state.pov === state.host && state.players.X.controller !== void 0 && state.players.O.controller !== void 0) {
            $$renderer2.push("<!--[-->");
            $$renderer2.push(`<button>START GAME</button>`);
          } else {
            $$renderer2.push("<!--[!-->");
          }
          $$renderer2.push(`<!--]--></div>`);
        } else {
          $$renderer2.push("<!--[!-->");
          if (state.gameStage === "midgame") {
            $$renderer2.push("<!--[-->");
            const isNominatingPlayer = state.turnPart === TurnPart.Nominating && state.players[state.whoseTurnToNominate].controller === state.pov;
            const isBiddingPlayer = state.turnPart === TurnPart.Bidding && state.players[state.whoseTurnToBid].controller === state.pov;
            const xTurn = state.whoseTurnToNominate === Side.X && state.turnPart === TurnPart.Nominating || state.whoseTurnToBid === Side.X && state.turnPart === TurnPart.Bidding;
            const oTurn = state.whoseTurnToNominate === Side.O && state.turnPart === TurnPart.Nominating || state.whoseTurnToBid === Side.O && state.turnPart === TurnPart.Bidding;
            $$renderer2.push(`<div class="center-on-page svelte-1y3eif9"><div class="game-layout svelte-1y3eif9"><div class="player-info svelte-1y3eif9">`);
            X($$renderer2, { size: 120 });
            $$renderer2.push(`<!----> <span${attr_class("money svelte-1y3eif9", void 0, { "this-players-turn": xTurn })}>$${escape_html(state.players.X.money)} `);
            if (state.settings.useTiebreaker) {
              $$renderer2.push("<!--[-->");
              $$renderer2.push(`· ${escape_html(millisToMinutesAndSeconds(state.players.X.timeUsed))}`);
            } else {
              $$renderer2.push("<!--[!-->");
            }
            $$renderer2.push(`<!--]--></span> `);
            if (state.pov === state.players.X.controller) {
              $$renderer2.push("<!--[-->");
              $$renderer2.push(`<span class="controller svelte-1y3eif9">(you)</span>`);
            } else {
              $$renderer2.push("<!--[!-->");
              if (state.players.X.controller === void 0 && state.players[oppositeSideOf(Side.X)].controller !== state.pov) {
                $$renderer2.push("<!--[-->");
                $$renderer2.push(`<button class="svelte-1y3eif9">REPLACE</button>`);
              } else {
                $$renderer2.push("<!--[!-->");
                if (state.players.X.controller === void 0) {
                  $$renderer2.push("<!--[-->");
                  $$renderer2.push(`<span class="controller svelte-1y3eif9">(disconnected)</span>`);
                } else {
                  $$renderer2.push("<!--[!-->");
                }
                $$renderer2.push(`<!--]-->`);
              }
              $$renderer2.push(`<!--]-->`);
            }
            $$renderer2.push(`<!--]--></div> <div class="board-container svelte-1y3eif9"><div class="board svelte-1y3eif9"><!--[-->`);
            const each_array = ensure_array_like(state.squares);
            for (let i = 0, $$length = each_array.length; i < $$length; i++) {
              let row = each_array[i];
              $$renderer2.push(`<!--[-->`);
              const each_array_1 = ensure_array_like(row);
              for (let j = 0, $$length2 = each_array_1.length; j < $$length2; j++) {
                let cell = each_array_1[j];
                const isCurrentlyNominated = state.currentlyNominatedSquare !== null && i === state.currentlyNominatedSquare[0] && j === state.currentlyNominatedSquare[1];
                const isNominating = gameState.nominating !== null && i === gameState.nominating[0] && j === gameState.nominating[1];
                $$renderer2.push(`<div class="square svelte-1y3eif9">`);
                if (cell === Side.X) {
                  $$renderer2.push("<!--[-->");
                  X($$renderer2, { size: 100 });
                } else {
                  $$renderer2.push("<!--[!-->");
                  if (cell === Side.O) {
                    $$renderer2.push("<!--[-->");
                    O($$renderer2, { size: 100 });
                  } else {
                    $$renderer2.push("<!--[!-->");
                    if (isBiddingPlayer && isCurrentlyNominated) {
                      $$renderer2.push("<!--[-->");
                      $$renderer2.push(`<div class="bidding-ui svelte-1y3eif9"><p class="svelte-1y3eif9">Bid:</p> <div class="form-field"><input type="number"${attr("min", state.lastBid + 1)}${attr("max", state.players[state.whoseTurnToBid].money)}${attr("value", gameState.currentBid)} class="svelte-1y3eif9"/> <input type="submit" value="BID" style="margin-top: 0;"/></div> <div class="form-field"><input type="submit" class="cancel svelte-1y3eif9" value="PASS"/></div></div>`);
                    } else {
                      $$renderer2.push("<!--[!-->");
                      if (isNominating) {
                        $$renderer2.push("<!--[-->");
                        $$renderer2.push(`<div class="bidding-ui svelte-1y3eif9"><p class="svelte-1y3eif9">Starting bid:</p> <div class="form-field"><input type="number"${attr("min", 0)}${attr("max", state.players[state.whoseTurnToNominate].money)}${attr("value", gameState.currentBid)} class="svelte-1y3eif9"/> <input type="submit" value="BID" style="margin-top: 0;"/></div> <div class="form-field"><input type="submit" class="cancel svelte-1y3eif9" value="CANCEL"/></div></div>`);
                      } else {
                        $$renderer2.push("<!--[!-->");
                        if (isNominatingPlayer) {
                          $$renderer2.push("<!--[-->");
                          $$renderer2.push(`<button class="nominate svelte-1y3eif9">Nominate</button>`);
                        } else {
                          $$renderer2.push("<!--[!-->");
                          if (isCurrentlyNominated) {
                            $$renderer2.push("<!--[-->");
                            $$renderer2.push(`<span class="last-bid svelte-1y3eif9">$${escape_html(state.lastBid)}</span>`);
                          } else {
                            $$renderer2.push("<!--[!-->");
                          }
                          $$renderer2.push(`<!--]-->`);
                        }
                        $$renderer2.push(`<!--]-->`);
                      }
                      $$renderer2.push(`<!--]-->`);
                    }
                    $$renderer2.push(`<!--]-->`);
                  }
                  $$renderer2.push(`<!--]-->`);
                }
                $$renderer2.push(`<!--]--></div>`);
              }
              $$renderer2.push(`<!--]-->`);
            }
            $$renderer2.push(`<!--]--></div></div> <div class="player-info svelte-1y3eif9">`);
            O($$renderer2, { size: 120 });
            $$renderer2.push(`<!----> <span${attr_class("money svelte-1y3eif9", void 0, { "this-players-turn": oTurn })}>$${escape_html(state.players.O.money)} `);
            if (state.settings.useTiebreaker) {
              $$renderer2.push("<!--[-->");
              $$renderer2.push(`· ${escape_html(millisToMinutesAndSeconds(state.players.O.timeUsed))}`);
            } else {
              $$renderer2.push("<!--[!-->");
            }
            $$renderer2.push(`<!--]--></span> `);
            if (state.pov === state.players.O.controller) {
              $$renderer2.push("<!--[-->");
              $$renderer2.push(`<span class="controller svelte-1y3eif9">(you)</span>`);
            } else {
              $$renderer2.push("<!--[!-->");
              if (state.players.O.controller === void 0 && state.players[oppositeSideOf(Side.O)].controller !== state.pov) {
                $$renderer2.push("<!--[-->");
                $$renderer2.push(`<button class="svelte-1y3eif9">REPLACE</button>`);
              } else {
                $$renderer2.push("<!--[!-->");
                if (state.players.O.controller === void 0) {
                  $$renderer2.push("<!--[-->");
                  $$renderer2.push(`<span class="controller svelte-1y3eif9">(disconnected)</span>`);
                } else {
                  $$renderer2.push("<!--[!-->");
                }
                $$renderer2.push(`<!--]-->`);
              }
              $$renderer2.push(`<!--]-->`);
            }
            $$renderer2.push(`<!--]--></div></div> <p class="instruction svelte-1y3eif9">`);
            if (isNominatingPlayer && gameState.nominating === null) {
              $$renderer2.push("<!--[-->");
              $$renderer2.push(`Click a square to put it up for auction.`);
            } else {
              $$renderer2.push("<!--[!-->");
              if (isNominatingPlayer && gameState.nominating !== null) {
                $$renderer2.push("<!--[-->");
                $$renderer2.push(`Set your starting bid for this square.`);
              } else {
                $$renderer2.push("<!--[!-->");
                if (state.turnPart === TurnPart.Nominating) {
                  $$renderer2.push("<!--[-->");
                  $$renderer2.push(`Waiting for ${escape_html(state.whoseTurnToNominate)} to nominate a square.`);
                } else {
                  $$renderer2.push("<!--[!-->");
                  if (isBiddingPlayer) {
                    $$renderer2.push("<!--[-->");
                    $$renderer2.push(`Make a bid on the square, or else pass.`);
                  } else {
                    $$renderer2.push("<!--[!-->");
                    if (state.turnPart === TurnPart.Bidding) {
                      $$renderer2.push("<!--[-->");
                      $$renderer2.push(`Waiting for ${escape_html(state.whoseTurnToBid)} to bid.`);
                    } else {
                      $$renderer2.push("<!--[!-->");
                      $$renderer2.push(` `);
                    }
                    $$renderer2.push(`<!--]-->`);
                  }
                  $$renderer2.push(`<!--]-->`);
                }
                $$renderer2.push(`<!--]-->`);
              }
              $$renderer2.push(`<!--]-->`);
            }
            $$renderer2.push(`<!--]--></p></div>`);
          } else {
            $$renderer2.push("<!--[!-->");
            $$renderer2.push(`<div class="center-on-page svelte-1y3eif9"><div class="game-layout svelte-1y3eif9"><div class="player-info svelte-1y3eif9">`);
            X($$renderer2, { size: 120 });
            $$renderer2.push(`<!----> <span class="money svelte-1y3eif9">$${escape_html(state.players.X.money)}</span></div> <div class="board-container svelte-1y3eif9"><div class="board svelte-1y3eif9"><!--[-->`);
            const each_array_2 = ensure_array_like(state.squares);
            for (let i = 0, $$length = each_array_2.length; i < $$length; i++) {
              let row = each_array_2[i];
              $$renderer2.push(`<!--[-->`);
              const each_array_3 = ensure_array_like(row);
              for (let j = 0, $$length2 = each_array_3.length; j < $$length2; j++) {
                let cell = each_array_3[j];
                $$renderer2.push(`<div class="square svelte-1y3eif9">`);
                if (cell === Side.X) {
                  $$renderer2.push("<!--[-->");
                  X($$renderer2, { size: 100 });
                } else {
                  $$renderer2.push("<!--[!-->");
                  if (cell === Side.O) {
                    $$renderer2.push("<!--[-->");
                    O($$renderer2, { size: 100 });
                  } else {
                    $$renderer2.push("<!--[!-->");
                  }
                  $$renderer2.push(`<!--]-->`);
                }
                $$renderer2.push(`<!--]--></div>`);
              }
              $$renderer2.push(`<!--]-->`);
            }
            $$renderer2.push(`<!--]--> `);
            if (state.winner.winningSide !== Side.None) {
              $$renderer2.push("<!--[-->");
              $$renderer2.push(`<svg viewBox="0 0 300 300" class="winner-line svelte-1y3eif9"><line${attr("x1", state.winner.start[1] === state.winner.end[1] ? 50 + 100 * state.winner.start[1] : 10 + 140 * state.winner.start[1])}${attr("y1", state.winner.start[0] === state.winner.end[0] ? 50 + 100 * state.winner.start[0] : 10 + 140 * state.winner.start[0])}${attr("x2", state.winner.start[1] === state.winner.end[1] ? 50 + 100 * state.winner.end[1] : 10 + 140 * state.winner.end[1])}${attr("y2", state.winner.start[0] === state.winner.end[0] ? 50 + 100 * state.winner.end[0] : 10 + 140 * state.winner.end[0])}${attr("stroke", state.winner.winningSide === Side.X ? "#d48" : "#3bd")}${attr("stroke-width", 3)}></line></svg>`);
            } else {
              $$renderer2.push("<!--[!-->");
            }
            $$renderer2.push(`<!--]--> <div class="winner-name svelte-1y3eif9">`);
            if (state.winner.winningSide === Side.None) {
              $$renderer2.push("<!--[-->");
              $$renderer2.push(`<span style="border-color: var(--bg-5);" class="svelte-1y3eif9">It's a draw.</span>`);
            } else {
              $$renderer2.push("<!--[!-->");
              $$renderer2.push(`<span class="svelte-1y3eif9">${escape_html(state.winner.winningSide)} wins!</span>`);
            }
            $$renderer2.push(`<!--]--></div></div> `);
            if (state.pov === state.host) {
              $$renderer2.push("<!--[-->");
              $$renderer2.push(`<button style="margin-top: 2rem;">REMATCH</button>`);
            } else {
              $$renderer2.push("<!--[!-->");
            }
            $$renderer2.push(`<!--]--></div> <div class="player-info svelte-1y3eif9">`);
            O($$renderer2, { size: 120 });
            $$renderer2.push(`<!----> <span class="money svelte-1y3eif9">$${escape_html(state.players.O.money)}</span></div></div></div>`);
          }
          $$renderer2.push(`<!--]-->`);
        }
        $$renderer2.push(`<!--]-->`);
      }
      $$renderer2.push(`<!--]-->`);
    }
    $$renderer2.push(`<!--]-->`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}

export { _page as default };
//# sourceMappingURL=_page.svelte-DQi4CwXa.js.map
