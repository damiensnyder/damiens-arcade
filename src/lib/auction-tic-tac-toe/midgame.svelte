<script lang="ts">
  import Gameboard from "$lib/auction-tic-tac-toe/gameboard.svelte";
  import Player from "$lib/auction-tic-tac-toe/player.svelte";
  import Instruction from "$lib/auction-tic-tac-toe/instruction.svelte";
  import { Side } from "$lib/auction-tic-tac-toe/types";
  import EventLog from "$lib/auction-tic-tac-toe/event-log.svelte";
</script>
  
<div class="center-on-page">
  <div class="horiz">
    <Player side={Side.X} />
    <Gameboard />
    <Player side={Side.O} />
  </div>
  <EventLog />
  <Instruction />
</div>

<style>
  .horiz {
    width: 100%;
    justify-content: space-evenly;
  }
</style>