import { _ as store_get, W as head, X as ensure_array_like, Z as attr_class, Y as attr, $ as unsubscribe_stores } from './index2-BI7tZrFT.js';
import { e as escape_html, c as ssr_context, g as getContext } from './context-DDZhjpoT.js';
import './exports-CgQJUv15.js';
import './state.svelte-ClWQPWuE.js';

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
var Side = /* @__PURE__ */ ((Side2) => {
  Side2["X"] = "X";
  Side2["O"] = "O";
  Side2["None"] = "[none]";
  return Side2;
})(Side || {});
var TurnPart = /* @__PURE__ */ ((TurnPart2) => {
  TurnPart2["Nominating"] = "nominating";
  TurnPart2["Bidding"] = "bidding";
  TurnPart2["None"] = "none";
  return TurnPart2;
})(TurnPart || {});
function oppositeSideOf(side) {
  return side === Side.X ? Side.O : Side.X;
}
class AuctionTTTState {
  connection;
  // Local UI state
  currentBid = null;
  nominating = null;
  timerInterval = null;
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
    this.stopTimer();
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
        this.stopTimer();
        break;
      case "backToSettings":
        this.connection.addToLog("Returning to settings");
        break;
    }
  }
  // Timer management for tiebreaker
  startTimer() {
    if (this.timerInterval) return;
    this.timerInterval = setInterval(
      () => {
        const state = this.state;
        if (!state || state.gameStage !== "midgame" || !state.timeOfLastMove) return;
        const now = Date.now();
        const elapsed = now - state.timeOfLastMove;
        const whoseTurnItIs = state.turnPart === TurnPart.Bidding ? state.whoseTurnToBid : state.whoseTurnToNominate;
        if (whoseTurnItIs && state.players[whoseTurnItIs].timeUsed !== void 0) {
          state.players[whoseTurnItIs].timeUsed += elapsed;
          state.timeOfLastMove = now;
        }
      },
      1e3
    );
  }
  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }
}
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    const roomCode = store_get($$store_subs ??= {}, "$page", page).params.roomCode.toUpperCase();
    const gameState = new AuctionTTTState(roomCode);
    onDestroy(() => {
      gameState.disconnect();
    });
    head("1y3eif9", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>Auction Tic-Tac-Toe | ${escape_html(roomCode)}</title>`);
      });
    });
    $$renderer2.push(`<div class="game-container svelte-1y3eif9"><h1>Auction Tic-Tac-Toe</h1> `);
    if (!gameState.connected) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<p>Connecting to room ${escape_html(roomCode)}...</p>`);
    } else {
      $$renderer2.push("<!--[!-->");
      if (!gameState.state) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<p>Loading game state...</p>`);
      } else {
        $$renderer2.push("<!--[!-->");
        const state = gameState.state;
        $$renderer2.push(`<div class="room-info svelte-1y3eif9"><p>Room: ${escape_html(state.roomName)} (${escape_html(state.roomCode)})</p> <p>You are: ${escape_html(state.pov === state.host ? "Host" : "Guest")}</p> <p>Your side: ${escape_html(gameState.mySide)}</p></div> `);
        if (state.gameStage === "pregame") {
          $$renderer2.push("<!--[-->");
          $$renderer2.push(`<div class="pregame"><h2>Waiting to start...</h2> <div class="player-select svelte-1y3eif9"><div class="svelte-1y3eif9"><h3>Player X</h3> `);
          if (state.players.X.controller !== void 0) {
            $$renderer2.push("<!--[-->");
            $$renderer2.push(`<p>Joined</p> `);
            if (gameState.mySide === Side.X) {
              $$renderer2.push("<!--[-->");
              $$renderer2.push(`<button>Leave</button>`);
            } else {
              $$renderer2.push("<!--[!-->");
            }
            $$renderer2.push(`<!--]-->`);
          } else {
            $$renderer2.push("<!--[!-->");
            $$renderer2.push(`<button>Join as X</button>`);
          }
          $$renderer2.push(`<!--]--></div> <div class="svelte-1y3eif9"><h3>Player O</h3> `);
          if (state.players.O.controller !== void 0) {
            $$renderer2.push("<!--[-->");
            $$renderer2.push(`<p>Joined</p> `);
            if (gameState.mySide === Side.O) {
              $$renderer2.push("<!--[-->");
              $$renderer2.push(`<button>Leave</button>`);
            } else {
              $$renderer2.push("<!--[!-->");
            }
            $$renderer2.push(`<!--]-->`);
          } else {
            $$renderer2.push("<!--[!-->");
            $$renderer2.push(`<button>Join as O</button>`);
          }
          $$renderer2.push(`<!--]--></div></div> `);
          if (state.pov === state.host && state.players.X.controller !== void 0 && state.players.O.controller !== void 0) {
            $$renderer2.push("<!--[-->");
            $$renderer2.push(`<button>Start Game</button>`);
          } else {
            $$renderer2.push("<!--[!-->");
          }
          $$renderer2.push(`<!--]--></div>`);
        } else {
          $$renderer2.push("<!--[!-->");
          if (state.gameStage === "midgame") {
            $$renderer2.push("<!--[-->");
            $$renderer2.push(`<div class="midgame"><div class="players-info svelte-1y3eif9"><div><h3>Player X</h3> <p>Money: $${escape_html(state.players.X.money)}</p></div> <div><h3>Player O</h3> <p>Money: $${escape_html(state.players.O.money)}</p></div></div> <div class="board svelte-1y3eif9"><!--[-->`);
            const each_array = ensure_array_like(state.squares);
            for (let i = 0, $$length = each_array.length; i < $$length; i++) {
              let row = each_array[i];
              $$renderer2.push(`<!--[-->`);
              const each_array_1 = ensure_array_like(row);
              for (let j = 0, $$length2 = each_array_1.length; j < $$length2; j++) {
                let cell = each_array_1[j];
                $$renderer2.push(`<button${attr_class("square svelte-1y3eif9", void 0, { "X": cell === Side.X, "O": cell === Side.O })}${attr("disabled", cell !== Side.None || !gameState.isMyTurn || state.turnPart !== "nominating", true)}>${escape_html(cell === Side.None ? "" : cell)}</button>`);
              }
              $$renderer2.push(`<!--]-->`);
            }
            $$renderer2.push(`<!--]--></div> `);
            if (state.turnPart === "bidding" && gameState.isMyTurn) {
              $$renderer2.push("<!--[-->");
              $$renderer2.push(`<div class="bidding svelte-1y3eif9"><p>Current bid: $${escape_html(state.lastBid)}</p> <input type="number"${attr("value", gameState.currentBid)}${attr("min", state.lastBid + 1)}${attr("max", gameState.myPlayer?.money || 0)} class="svelte-1y3eif9"/> <button>Bid</button> <button>Pass</button></div>`);
            } else {
              $$renderer2.push("<!--[!-->");
              if (state.turnPart === "nominating" && gameState.isMyTurn) {
                $$renderer2.push("<!--[-->");
                $$renderer2.push(`<div class="nominating svelte-1y3eif9"><p>Your turn to nominate a square</p> <label>Starting bid: $ <input type="number"${attr("value", gameState.currentBid)}${attr("min", 0)}${attr("max", gameState.myPlayer?.money || 0)} class="svelte-1y3eif9"/></label></div>`);
              } else {
                $$renderer2.push("<!--[!-->");
                $$renderer2.push(`<p>Waiting for opponent...</p>`);
              }
              $$renderer2.push(`<!--]-->`);
            }
            $$renderer2.push(`<!--]--></div>`);
          } else {
            $$renderer2.push("<!--[!-->");
            $$renderer2.push(`<div class="postgame"><h2>Game Over!</h2> `);
            if (state.winner.winningSide === Side.None) {
              $$renderer2.push("<!--[-->");
              $$renderer2.push(`<p>It's a tie!</p>`);
            } else {
              $$renderer2.push("<!--[!-->");
              $$renderer2.push(`<p>${escape_html(state.winner.winningSide)} wins!</p>`);
            }
            $$renderer2.push(`<!--]--> <div class="board svelte-1y3eif9"><!--[-->`);
            const each_array_2 = ensure_array_like(state.squares);
            for (let i = 0, $$length = each_array_2.length; i < $$length; i++) {
              let row = each_array_2[i];
              $$renderer2.push(`<!--[-->`);
              const each_array_3 = ensure_array_like(row);
              for (let j = 0, $$length2 = each_array_3.length; j < $$length2; j++) {
                let cell = each_array_3[j];
                $$renderer2.push(`<div${attr_class("square svelte-1y3eif9", void 0, { "X": cell === Side.X, "O": cell === Side.O })}>${escape_html(cell === Side.None ? "" : cell)}</div>`);
              }
              $$renderer2.push(`<!--]-->`);
            }
            $$renderer2.push(`<!--]--></div> `);
            if (state.pov === state.host) {
              $$renderer2.push("<!--[-->");
              $$renderer2.push(`<button>Rematch</button>`);
            } else {
              $$renderer2.push("<!--[!-->");
            }
            $$renderer2.push(`<!--]--></div>`);
          }
          $$renderer2.push(`<!--]-->`);
        }
        $$renderer2.push(`<!--]--> <div class="event-log svelte-1y3eif9"><h3>Event Log</h3> <ul class="svelte-1y3eif9"><!--[-->`);
        const each_array_4 = ensure_array_like(gameState.eventLog);
        for (let $$index_4 = 0, $$length = each_array_4.length; $$index_4 < $$length; $$index_4++) {
          let event = each_array_4[$$index_4];
          $$renderer2.push(`<li class="svelte-1y3eif9">${escape_html(event)}</li>`);
        }
        $$renderer2.push(`<!--]--></ul></div>`);
      }
      $$renderer2.push(`<!--]-->`);
    }
    $$renderer2.push(`<!--]--></div>`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}

export { _page as default };
//# sourceMappingURL=_page.svelte-DKkUIeXI.js.map
