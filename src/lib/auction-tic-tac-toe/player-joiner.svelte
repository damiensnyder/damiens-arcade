<script lang="ts">
  import { Side } from "$lib/auction-tic-tac-toe/types";
  import { lastAction, pov } from "$lib/stores";
  import { players } from "$lib/auction-tic-tac-toe/stores";
  import X from "./x.svelte";
  import O from "./o.svelte";

  export let side: Side.X | Side.O;

  $: isSide = $players[side].controller === $pov;
  $: canJoinAsSide = $players[side].controller === undefined;

  function join() {
    lastAction.set({
      type: "join",
      side: side
    });
  }

  function leave() {
    lastAction.set({
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