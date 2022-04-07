<script lang="ts">
import { page } from "$app/stores";
import { connected, gameType, host, isPublic, lastAction, pov, roomCode, roomName } from "$lib/stores";
import { io } from "socket.io-client";
import { GameType, type Action, type Event } from "$lib/types";
import type { Viewpoint } from "$lib/types";
import AuctionTicTacToe from "$lib/auction-tic-tac-toe/frontend-main.svelte";
import NoGameSelected from "$lib/no-game-selected/frontend-main.svelte";
import { handleEvent, handleGamestate } from "$lib/auction-tic-tac-toe/event-handler";
import "../../styles/global.css";

const relativeUrl = $page.url.pathname;
const socket = io(relativeUrl);

socket.on('connect', () => {
  $connected = true;
});

socket.on('disconnect', () => {
  $connected = false
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
  if (event.type === "changeGameType") {
    $gameType = event.gameType;
  } else if (event.type === "changeRoomSettings") {
    if (event.isPublic !== undefined) {
      $isPublic = event.isPublic;
    }
    if (event.roomName !== undefined) {
      $roomName = event.roomName;
    }
  } else if (event.type === "changeHost") {
    $host = event.host;
  } else if ($gameType === GameType.AuctionTTT) {
    handleEvent(event);
  }
});

lastAction.subscribe((action: Action) => {
  socket.emit('action', action);
  console.log($lastAction);
});
</script>

{#if $roomCode !== "" }
  {#if $gameType === GameType.NoGameSelected}
    <NoGameSelected />
  {:else if $gameType === GameType.AuctionTTT}
    <AuctionTicTacToe />
  {/if}
{:else}
  <h1>Damien's Arcade</h1>
  <p>Connecting to game...</p>
{/if}