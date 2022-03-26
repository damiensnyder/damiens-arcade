<script lang="ts">
import { page } from "$app/stores";
import { io } from "socket.io-client";
import { Action, ActionCallback, GameType, Viewpoint } from "$lib/types";
import AuctionTicTacToe from "$lib/auction-tic-tac-toe/frontend-main.svelte";
import NoGameSelected from "$lib/no-game-selected/no-game-selected.svelte";

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
});

const socketCallback: ActionCallback = (action: Action) => {
  socket.emit('action', action);
}
</script>

{#if connected && gamestate != null}
  <h1>{gamestate.roomName}</h1>
  {#if gamestate.settings.gameType === GameType.NoGameSelected}
    <NoGameSelected gamestate={gamestate} socketCallback={socketCallback} />
  {:else if gamestate.settings.gameType === GameType.AuctionTTT}
    <AuctionTicTacToe gamestate={gamestate} socketCallback={socketCallback} />
  {/if}
{:else}
  <p>connecting...</p>
{/if}