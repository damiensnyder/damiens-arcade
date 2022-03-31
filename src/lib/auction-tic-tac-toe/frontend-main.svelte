<script lang="ts">
import Pregame from "$lib/auction-tic-tac-toe/pregame.svelte";
import Midgame from "$lib/auction-tic-tac-toe/midgame.svelte";
import Postgame from "$lib/auction-tic-tac-toe/postgame.svelte";
import { gamestate } from "$lib/stores";
</script>

{#if $gamestate.gameStatus === "pregame"}
  <Pregame />
{:else if $gamestate.gameStatus === "midgame"}
  <Midgame />
{:else}
  <Postgame />
{/if}