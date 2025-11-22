<script lang="ts">
import { page } from "$app/stores";
import { connected, eventLog, host, isPublic, lastAction, pov, roomCode, roomName } from "$lib/stores";
import { io } from "socket.io-client";
import { eventHandler as auctionTTTEventHandler, handleGamestate as handleAuctionTTTGamestate, switchToType as switchToAuctionTTT } from "$lib/auction-tic-tac-toe/event-handler";
import type { AuctionTTTAction, AuctionTTTEvent, AuctionTTTViewpoint } from "$lib/auction-tic-tac-toe/types";
import EventLog from "$lib/event-log.svelte";
import "../../../styles/global.css";
import "../../../styles/techno.css";
import Pregame from "$lib/auction-tic-tac-toe/pregame.svelte";
import Midgame from "$lib/auction-tic-tac-toe/midgame.svelte";
import Postgame from "$lib/auction-tic-tac-toe/postgame.svelte";
import { gameStage } from "$lib/auction-tic-tac-toe/stores";

const relativeUrl = $page.url.pathname;
const socket = io(relativeUrl);

let checkForDisconnect;

function handleDisconnect() {
  $connected = false
  $pov = -1;
  $lastAction = null;
  eventLog.append("You have disconnected from the game.");
  clearInterval(checkForDisconnect);
  socket.connect();
}

socket.on('connect', () => {
  $connected = true;
  eventLog.append("You have connected to the game.")

  checkForDisconnect = setInterval(function() {
    if (!socket.connected) {
      clearInterval(checkForDisconnect);
      handleDisconnect();
    }
  }, 5000)
});

socket.on('disconnect', handleDisconnect);

socket.on('gamestate', (gamestate: AuctionTTTViewpoint) => {
  $roomCode = gamestate.roomCode;
  $roomName = gamestate.roomName;
  $isPublic = gamestate.isPublic;
  $host = gamestate.host;
  $pov = gamestate.pov;
  handleAuctionTTTGamestate(gamestate);
  console.log(gamestate);
});

socket.on("event", (event: AuctionTTTEvent) => {
  console.log(event);

  // CHANGE ROOM SETTINGS
  if (event.type === "changeRoomSettings") {
    $isPublic = event.isPublic;
    $roomName = event.roomName;

    // CHANGE HOST
  } else if (event.type === "changeHost") {
    $host = event.host;
    if (event.host === $pov) {
      eventLog.append("The previous host has disconnected. You are now the host of this room.");
    }

    // HANDLE AUCTION TTT EVENTS
  } else {
    // @ts-ignore — "union type too complex to represent"?? maybe for you...
    // anyway this calls the event handler corresponding to the event's type
    auctionTTTEventHandler[event.type](event);
  }
});

// emit every action sent via this store to the server
lastAction.subscribe((action: AuctionTTTAction) => {
  socket.emit('action', action);
  console.log($lastAction);
});
</script>

<svelte:head>
  <title>Damien's Arcade | Auction Tic-Tac-Toe | {$roomName}</title>
</svelte:head>

{#if $gameStage === null}
  <h1>Damien's Arcade</h1>
  <p>Connecting to game...</p>
{:else if $gameStage === "pregame"}
  <Pregame />
{:else if $gameStage === "midgame"}
  <Midgame />
{:else}
  <Postgame />
{/if}
<EventLog />