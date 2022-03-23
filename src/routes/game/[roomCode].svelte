<script lang="ts">
import { page } from "$app/stores";
import { io } from "socket.io-client";
import { Action, GameType } from "$lib/types";
import AuctionTicTacToe from "$lib/auction-tic-tac-toe.svelte";

const absoluteUrl = $page.url.toString();
const relativeUrl = $page.url.pathname;
const socket = io(relativeUrl);

let connected = false;
let gamestate = null;

socket.on('connect', () => {
  connected = true;
});

socket.on('disconnect', () => {
  connected = false;
});

socket.on('gamestate', (newGamestate) => {
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
  <h1>{gamestate.roomName}</h1>
  {#if gamestate.roomState.gameType === GameType.AuctionTTT}
    <AuctionTicTacToe gamestate={gamestate} socketCallback={socketCallback} />
  {/if}
  <p>Invite a friend:</p>
  <input value={absoluteUrl} readonly />
  <button on:click={copyInviteLink}>Copy</button>
{:else}
  <p>connecting...</p>
{/if}