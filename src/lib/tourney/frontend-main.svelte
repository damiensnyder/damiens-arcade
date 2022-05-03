<script lang="ts">
  import Pregame from "$lib/tourney/pregame.svelte";
  import Midgame from "$lib/tourney/midgame.svelte";
  import { gameStage } from "$lib/tourney/stores";
  import { roomName } from "$lib/stores";
</script>

<svelte:head>
  <title>Damien's Arcade | Colosseum Clash | {$roomName}</title>
</svelte:head>

{#if $gameStage === "pregame"}
  <Pregame />
{:else}
  <Midgame />
{/if}