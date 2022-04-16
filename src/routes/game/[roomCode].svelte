<script lang="ts">
import { page } from "$app/stores";
import { connected, eventLog, gameType, host, isPublic, lastAction, pov, roomCode, roomName } from "$lib/stores";
import { io } from "socket.io-client";
import { GameType, type Action, type Event } from "$lib/types";
import type { Viewpoint } from "$lib/types";
import AuctionTicTacToe from "$lib/auction-tic-tac-toe/frontend-main.svelte";
import NoGameSelected from "$lib/no-game-selected/frontend-main.svelte";
import { eventHandler as auctionTTTEventHandler, handleGamestate, switchToType as switchToAuctionTTT } from "$lib/auction-tic-tac-toe/event-handler";
import EventLog from "$lib/event-log.svelte";
import "../../styles/global.css";

const relativeUrl = $page.url.pathname;
const socket = io(relativeUrl);

socket.on('connect', () => {
  $connected = true;
  eventLog.append("You have connected to the game.")
});

socket.on('disconnect', () => {
  $connected = false
  $pov = -1;
  $lastAction.set(null);
  eventLog.append("You have disconnected from the game.");
});

socket.on('gamestate', (gamestate: Viewpoint) => {
  $roomCode = gamestate.roomCode;
  $roomName = gamestate.roomName;
  $isPublic = gamestate.isPublic;
  $host = gamestate.host;
  $pov = gamestate.pov;
  $gameType = gamestate.gameType;
  if (gamestate.gameType === GameType.AuctionTTT) {
    handleGamestate(gamestate);
  }
  console.log(gamestate);
});

socket.on("event", (event: Event) => {
  console.log(event);

  // CHANGE GAME TYPE
  if (event.type === "changeGameType") {
    $gameType = event.gameType;
    if ($gameType === GameType.AuctionTTT) {
      switchToAuctionTTT();
    }

    // CHANGE ROOM SETTINGS
  } else if (event.type === "changeRoomSettings") {
    if (event.isPublic !== undefined) {
      $isPublic = event.isPublic;
    }
    if (event.roomName !== undefined) {
      $roomName = event.roomName;
    }

    // CHANGE HOST
  } else if (event.type === "changeHost") {
    $host = event.host;
    if (event.host === $pov) {
      eventLog.append("The previous host has disconnected. You are now the host of this room.");
    }

    // HANDLE AUCTION TTT EVENTS
  } else if ($gameType === GameType.AuctionTTT) {
    // @ts-ignore — "union type too complex to represent"?? maybe for you...
    // anyway this calls the event handler corresponding to the event's type
    auctionTTTEventHandler[event.type](event);
  }
});

// emit every action sent via this store to the server
lastAction.subscribe((action: Action) => {
  // tbh i don't know if the two conditions are doing anything
  if (action != null && $pov !== -1) {
    socket.emit('action', action)
    console.log($lastAction);
  };
});
</script>

{#if $roomCode !== ""}
  {#if $gameType === GameType.NoGameSelected}
    <NoGameSelected />
  {:else if $gameType === GameType.AuctionTTT}
    <AuctionTicTacToe />
  {/if}
{:else}
  <h1>Damien's Arcade</h1>
  <p>Connecting to game...</p>
{/if}
<EventLog />