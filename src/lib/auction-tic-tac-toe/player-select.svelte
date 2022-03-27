<script lang="ts">
  import type { ActionCallback } from "$lib/types";
  import { Side } from "$lib/auction-tic-tac-toe/types";
  import type { AuctionTTTViewpoint } from "$lib/auction-tic-tac-toe/types";
  import X from "$lib/auction-tic-tac-toe/x.svelte";
  import O from "$lib/auction-tic-tac-toe/o.svelte";
import PlayerJoiner from "./player-joiner.svelte";

  export let gamestate: AuctionTTTViewpoint;
  export let callback: ActionCallback;
</script>

<div class="player-select">
  <PlayerJoiner gamestate={gamestate} callback={callback} side={Side.X} />
  <PlayerJoiner gamestate={gamestate} callback={callback} side={Side.O} />
</div>

<style>
  .player-select {
    justify-content: space-evenly;
    align-self: stretch;
    padding-left: 2rem;
    margin-left: 2.5rem;
    border-left: 2px solid var(--text-1);
  }
</style>