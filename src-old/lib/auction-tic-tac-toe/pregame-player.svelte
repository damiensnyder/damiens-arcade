<script lang="ts">
  import { Side } from "$lib/auction-tic-tac-toe/types";
  import { lastAction, pov } from "$lib/stores";
  import { players } from "$lib/auction-tic-tac-toe/stores";
  import X from "$lib/auction-tic-tac-toe/x.svelte";
  import O from "$lib/auction-tic-tac-toe/o.svelte";
  import { oppositeSideOf } from "$lib/auction-tic-tac-toe/utils";

  export let side: Side.X | Side.O;

  $: isSide = $players[side].controller === $pov;
  $: canJoinAsSide = $players[side].controller === undefined;

  function join() {
    if ($players[oppositeSideOf(side)].controller === $pov) {
      leave();
    }
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
    <button on:submit={join} on:click={join}>
      JOIN
    </button>
  {:else if isSide}
    <button on:submit={leave} on:click={leave}>
      LEAVE
    </button>
  {:else}
    <button disabled>
      JOIN
    </button>
  {/if}
</div>