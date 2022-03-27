<script lang="ts">
import { page } from "$app/stores";
import { io } from "socket.io-client";
import { GameType } from "$lib/types";
import type { Action, ActionCallback, Viewpoint } from "$lib/types";
import AuctionTicTacToe from "$lib/auction-tic-tac-toe/frontend-main.svelte";
import NoGameSelected from "$lib/no-game-selected/frontend-main.svelte";
import "../../styles/global.css";

const relativeUrl = $page.url.pathname;
const socket = io(relativeUrl);

let connected = false;
let gamestate: Viewpoint = null;

socket.on('connect', () => {
  connected = true;
});

socket.on('disconnect', () => {
  connected = false;
});

socket.on('gamestate', (newGamestate) => {
  gamestate = newGamestate;
  console.log(gamestate);
});

const socketCallback: ActionCallback = (action: Action) => {
  socket.emit('action', action);
  console.log(action);
}
</script>

{#if connected && gamestate != null}
  {#if gamestate.gameType === GameType.NoGameSelected}
    <NoGameSelected gamestate={gamestate} socketCallback={socketCallback} />
  {:else if gamestate.gameType === GameType.AuctionTTT}
    <AuctionTicTacToe gamestate={gamestate} socketCallback={socketCallback} />
  {/if}
{:else}
  <h1>Damien's Arcade</h1>
  <p>Connecting to game...</p>
{/if}