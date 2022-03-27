<script lang="ts">
  import type { ActionCallback } from "$lib/types";
  import type { AuctionTTTViewpoint } from "./types";
  import X from "./x.svelte";
  import O from "./o.svelte";

  export let gamestate: AuctionTTTViewpoint;
  export let callback: ActionCallback;
</script>

<div class="player-select">
  <X />
  <O />
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