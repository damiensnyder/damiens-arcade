<script lang="ts">
import type { ActionCallback } from "$lib/types";
import type { AuctionTTTViewpoint } from "$lib/auction-tic-tac-toe/types";
import Pregame from "$lib/auction-tic-tac-toe/pregame.svelte";
import Midgame from "$lib/auction-tic-tac-toe/midgame.svelte";

export let gamestate: AuctionTTTViewpoint;
export let callback: ActionCallback;

const actionCallback: ActionCallback = (action) => {
  callback(action);
};
</script>

<h1>Damien's Arcade</h1>
{#if gamestate.gameStatus === "pregame"}
  <Pregame gamestate={gamestate} callback={actionCallback} />
{:else if gamestate.gameStatus === "midgame"}
  <Midgame gamestate={gamestate} callback={actionCallback} />
{/if}