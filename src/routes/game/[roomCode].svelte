<script lang="ts">
import { page } from "$app/stores";
import { connected, gameType, host, isPublic, lastAction, pov, roomCode, roomName } from "$lib/stores";
import { io } from "socket.io-client";
import { GameType, type Action, type Event } from "$lib/types";
import type { Viewpoint } from "$lib/types";
import AuctionTicTacToe from "$lib/auction-tic-tac-toe/frontend-main.svelte";
import NoGameSelected from "$lib/no-game-selected/frontend-main.svelte";
import "../../styles/global.css";
import handleEvent from "$lib/auction-tic-tac-toe/event-handler";
import type { AuctionTTTEvent } from "$lib/auction-tic-tac-toe/types";

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
  console.log(gamestate);
});

socket.on("event", (event: Event) => {
  if (event.type === "changeGameType") {

  } else if (event.type === "changeRoomSettings") {
    if (event.settings.isPublic !== undefined) {
      $isPublic = event.settings.isPublic;
    }
    if (event.settings.roomName !== undefined) {
      $roomName = event.settings.roomName;
    }
  } else if (event.type === "changeHost") {
    $host = event.host;
  } else if ($gameType === GameType.AuctionTTT) {
    handleEvent(event as AuctionTTTEvent);
  }
});

lastAction.subscribe((action: Action) => {
  socket.emit('action', action);
  console.log($lastAction);
});
</script>

{#if $gamestate.roomCode !== "" }
  {#if $gamestate.gameType === GameType.NoGameSelected}
    <NoGameSelected />
  {:else if $gamestate.gameType === GameType.AuctionTTT}
    <AuctionTicTacToe />
  {/if}
{:else}
  <h1>Damien's Arcade</h1>
  <p>Connecting to game...</p>
{/if}