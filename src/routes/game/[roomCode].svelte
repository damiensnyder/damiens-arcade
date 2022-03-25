<script lang="ts">
import { page } from "$app/stores";
import { io } from "socket.io-client";
import { GameType, Viewpoint } from "$lib/types";
import AuctionTicTacToe from "$lib/auction-tic-tac-toe.svelte";
import BasicSettingsSelector from "$lib/basic-settings-selector.svelte";

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

// note to self: you can do this with a store, and probably should
function socketCallback(action: any) {
  socket.emit('action', action);
}
</script>

{#if connected && gamestate != null}
  <h1>{gamestate.roomName}</h1>
  {#if gamestate.settings.gameType === GameType.None}
    <BasicSettingsSelector gamestate={gamestate} socketCallback={socketCallback} />
  {:else if gamestate.settings.gameType === GameType.AuctionTTT}
    <AuctionTicTacToe gamestate={gamestate} socketCallback={socketCallback} />
  {/if}
{:else}
  <p>connecting...</p>
{/if}