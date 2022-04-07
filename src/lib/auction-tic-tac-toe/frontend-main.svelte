<script lang="ts">
import Pregame from "$lib/auction-tic-tac-toe/pregame.svelte";
import Midgame from "$lib/auction-tic-tac-toe/midgame.svelte";
import Postgame from "$lib/auction-tic-tac-toe/postgame.svelte";
import { gameStatus } from "$lib/auction-tic-tac-toe/stores";
</script>

{#if $gameStatus === "pregame"}
  <Pregame />
{:else if $gameStatus === "midgame"}
  <Midgame />
{:else}
  <Postgame />
{/if}