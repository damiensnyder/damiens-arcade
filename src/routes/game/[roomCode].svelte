<script lang="ts">
import { page } from "$app/stores";
import { connected, gameType, host, isPublic, lastAction, pov, roomCode, roomName } from "$lib/stores";
import { io } from "socket.io-client";
import { GameType, type Action, type Event } from "$lib/types";
import type { Viewpoint } from "$lib/types";
import AuctionTicTacToe from "$lib/auction-tic-tac-toe/frontend-main.svelte";
import NoGameSelected from "$lib/no-game-selected/frontend-main.svelte";
import { handleEvent, handleGamestate, switchToType as switchToAuctionTTT } from "$lib/auction-tic-tac-toe/event-handler";
import "../../styles/global.css";

const relativeUrl = $page.url.pathname;
const socket = io(relativeUrl);

socket.on('connect', () => {
  $connected = true;
});

socket.on('disconnect', () => {
  $connected = false
  $pov = -1;
  $lastAction.set(null);
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
  if (event.type === "changeGameType") {
    $gameType = event.gameType;
    if ($gameType === GameType.AuctionTTT) {
      switchToAuctionTTT();
    }
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