<script lang="ts">
  import type { ActionCallback } from "$lib/types";
  import { Side } from "$lib/auction-tic-tac-toe/types";
  import type { AuctionTTTViewpoint } from "$lib/auction-tic-tac-toe/types";
  import X from "./x.svelte";
  import O from "./o.svelte";

  export let gamestate: AuctionTTTViewpoint;
  export let callback: ActionCallback;
  export let side: Side.X | Side.O;

  $: isSide = typeof gamestate.pov === "number" &&
      gamestate.players[gamestate.pov].side === side;
  $: canJoinAsSide = gamestate.players.every((player) => {
    return player.side !== side;
  }) && typeof gamestate.pov !== "number";

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
    <button class="big-button" on:submit={join}>
      JOIN
    </button>
  {:else if isSide}
    <button class="big-button" on:submit={leave}>
      LEAVE
    </button>
  {:else}
    <button class="big-button" disabled>
      JOIN
    </button>
  {/if}
</div>