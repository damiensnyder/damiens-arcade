<script lang="ts">
import Pregame from "$lib/auction-tic-tac-toe/pregame.svelte";
import Midgame from "$lib/auction-tic-tac-toe/midgame.svelte";
import Postgame from "$lib/auction-tic-tac-toe/postgame.svelte";
import { gameStage } from "$lib/auction-tic-tac-toe/stores";
import { roomName } from "$lib/stores";
</script>

<svelte:head>
  <title>Damien's Arcade | Auction Tic-Tac-Toe | {$roomName}</title>
</svelte:head>

{#if $gameStage === "pregame"}
  <Pregame />
{:else if $gameStage === "midgame"}
  <Midgame />
{:else}
  <Postgame />
{/if}