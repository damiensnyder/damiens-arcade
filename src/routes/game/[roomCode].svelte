<script lang="ts">
import { page } from "$app/stores";
import { gamestate, lastAction } from "$lib/stores";
import { io } from "socket.io-client";
import { GameType, type Action } from "$lib/types";
import type { Viewpoint } from "$lib/types";
import AuctionTicTacToe from "$lib/auction-tic-tac-toe/frontend-main.svelte";
import NoGameSelected from "$lib/no-game-selected/frontend-main.svelte";
import "../../styles/global.css";

const relativeUrl = $page.url.pathname;
const socket = io(relativeUrl);

socket.on('connect', () => {
  gamestate.update((gs) => {
    gs.connected = true;
    return gs;
  });
});

socket.on('disconnect', () => {
  gamestate.update((gs) => {
    gs.connected = false;
    return gs;
  });
});

socket.on('gamestate', (newGamestate: Viewpoint) => {
  gamestate.set(newGamestate);
  console.log($gamestate);
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