<script lang="ts">
  import Gameboard from "./gameboard.svelte";
  import Player from "$lib/auction-tic-tac-toe/player.svelte";
  import { Side } from "$lib/auction-tic-tac-toe/types";
  import { host, lastAction, pov } from "$lib/stores";
import EventLog from "$lib/auction-tic-tac-toe/event-log.svelte";

  function rematch() {
    lastAction.set({
      type: "rematch"
    });
  }

  function backToSettings() {
    lastAction.set({
      type: "backToSettings"
    });
  }
</script>
  
<div class="center-on-page">
  <div class="horiz gs-outer">
    <Player side={Side.X} />
    <Gameboard />
    <Player side={Side.O} />
  </div>
  <EventLog />
  <div class="horiz">
    <button class="big-button"
        on:click={rematch}
        on:submit={rematch}
        disabled={$pov !== $host}>REMATCH</button>
    <button class="big-button"
        on:click={backToSettings}
        on:submit={backToSettings}
        disabled={$pov !== $host}>BACK TO LOBBY</button>
  </div>
</div>

<style>
  .gs-outer {
    width: 100%;
    justify-content: space-evenly;
  }

  button {
    margin: 1.5rem 1rem 0.65rem;
  }
</style>