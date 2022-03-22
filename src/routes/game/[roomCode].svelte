<script lang="ts">
import { page } from "$app/stores";
import { io } from "socket.io-client";
import type { Action } from "$lib/types";
import AuctionTicTacToe from "$lib/auction-tic-tac-toe.svelte";

const absoluteUrl = $page.url.toString();
const relativeUrl = $page.url.pathname;
const socket = io(relativeUrl);

let connected = false;
let gamestate: Viewpoint | null = null;

socket.on('connect', () => {
  connected = true;
});

socket.on('disconnect', () => {
  connected = false;
});

socket.on('gamestate', (newGamestate: Viewpoint) => {
  gamestate = newGamestate;
});

function socketCallback(action: Action) {
  socket.emit('action', action);
}

function copyInviteLink() {
  navigator.clipboard.writeText(absoluteUrl);
}
</script>

{#if connected && gamestate != null}
  {#if gamestate.gameplaySettings.gameType === "Auction Tic-Tac-Toe"}
    <AuctionTicTacToe gamestate={gamestate} socketCallback={socketCallback} />
  {/if}
  <h1>{gamestate.roomName}</h1>
  <p>Invite a friend:</p>
  <input value={absoluteUrl} readonly />
  <button on:click={copyInviteLink}>Copy</button>
{:else}
  <p>connecting...</p>
{/if}