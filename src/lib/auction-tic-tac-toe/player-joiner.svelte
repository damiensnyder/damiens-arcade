<script lang="ts">
  import type { ActionCallback } from "$lib/types";
  import { Side } from "$lib/auction-tic-tac-toe/types";
  import type { AuctionTTTViewpoint } from "$lib/auction-tic-tac-toe/types";
  import X from "./x.svelte";
  import O from "./o.svelte";

  export let gamestate: AuctionTTTViewpoint;
  export let callback: ActionCallback;
  export let side: Side.X | Side.O;

  $: isSide = gamestate.players.every((player) => {
    if (player.side === side) {
      return player.controller === gamestate.pov;
    }
    return true;
  });
  $: canJoinAsSide = gamestate.players.every((player) => {
    if (player.controller === gamestate.pov) {
      return false;
    }
    if (player.side === side) {
      return player.controller === undefined;
    }
    return true;
  });

  function join() {
    callback({
      type: "join",
      side: side
    });
  }

  function leave() {
    callback({
      type: "leave"
    });
  }
</script>

<div>
  {#if side === Side.X}
    <X size={50} />
  {:else}
    <O size={50} />
  {/if}
  {#if canJoinAsSide}
    <button class="big-button" on:submit={join} on:click={join}>
      JOIN
    </button>
  {:else if isSide}
    <button class="big-button" on:submit={leave} on:click={leave}>
      LEAVE
    </button>
  {:else}
    <button class="big-button" disabled>
      JOIN
    </button>
  {/if}
</div>