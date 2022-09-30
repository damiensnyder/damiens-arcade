<script lang="ts">
import { page } from "$app/stores";
import { connected, eventLog, host, isPublic, lastAction, pov, roomCode, roomName } from "$lib/stores";
import { io } from "socket.io-client";
import { eventHandler as tourneyEventHandler, handleGamestate as handleTourneyGamestate } from "$lib/tourney/event-handler";
import "../../../styles/global.css";
import "../../../styles/fun.css";
import type { TourneyAction, TourneyEvent, TourneyViewpoint } from "$lib/tourney/types";
import Pregame from "$lib/tourney/pregame.svelte";
import Midgame from "$lib/tourney/midgame.svelte";
import { gameStage } from "$lib/tourney/stores";

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

socket.on('gamestate', (gamestate: TourneyViewpoint) => {
  if (!gamestate) return;
  $roomCode = gamestate.roomCode;
  $roomName = gamestate.roomName;
  $isPublic = gamestate.isPublic;
  $host = gamestate.host;
  $pov = gamestate.pov;
  handleTourneyGamestate(gamestate);
  console.log(gamestate);
});

socket.on("event", (event: TourneyEvent) => {
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

  // HANDLE TOURNEY EVENTS
  } else {
    // @ts-ignore
    tourneyEventHandler[event.type](event);
  }
});

// emit every action sent via this store to the server
lastAction.subscribe((action: TourneyAction) => {
  socket.emit('action', action);
  console.log($lastAction);
});
</script>

<svelte:head>
  <title>Damien's Arcade | Mayhem Manager | {$roomName}</title>
</svelte:head>

{#if $gameStage === "pregame"}
  <Pregame />
{:else}
  <Midgame />
{/if}