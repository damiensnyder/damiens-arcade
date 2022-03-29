<script lang="ts">
  import Gameboard from "./gameboard.svelte";
  import Player from "$lib/auction-tic-tac-toe/player.svelte";
  import { Side } from "$lib/auction-tic-tac-toe/types";
</script>
  
<div class="center-on-page">
  <div class="horiz">
    <Player side={Side.X} />
    <Gameboard />
    <Player side={Side.O} />
  </div>
  <p>You should attempt to win, in this situation.</p>
</div>

<style>
  .horiz {
    width: 100%;
    justify-content: space-evenly;
  }

  p {
    margin-top: 1.75rem;
  }
</style>