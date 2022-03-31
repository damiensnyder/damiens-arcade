<script lang="ts">
  import Gameboard from "./gameboard.svelte";
  import Player from "$lib/auction-tic-tac-toe/player.svelte";
  import { Side } from "$lib/auction-tic-tac-toe/types";
  import { gamestate, lastAction } from "$lib/stores";

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
  <div class="horiz">
    <button class="big-button"
        on:click={rematch}
        on:submit={rematch}
        disabled={$gamestate.pov !== $gamestate.host}>REMATCH</button>
    <button class="big-button"
        on:click={backToSettings}
        on:submit={backToSettings}
        disabled={$gamestate.pov !== $gamestate.host}>BACK TO LOBBY</button>
  </div>
</div>

<style>
  .gs-outer {
    width: 100%;
    justify-content: space-evenly;
  }
  button {
    margin: 2rem 1rem;
  }
</style>