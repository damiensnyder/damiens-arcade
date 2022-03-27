<script lang="ts">
  import type { ActionCallback } from "$lib/types";
  import type { MidgameViewpoint } from "$lib/auction-tic-tac-toe/types";
  import Gameboard from "./gameboard.svelte";
  import O from "./o.svelte";
  import X from "./x.svelte";
  
  export let gamestate: MidgameViewpoint;
  export let callback: ActionCallback;
  
  const actionCallback: ActionCallback = (action) => {
    callback(action);
  };
</script>
  
<div class="horiz">
  <X size={100} />
  <Gameboard gamestate={gamestate} callback={actionCallback} />
  <O size={100} />
</div>
<p>You should attempt to win, in this situation.</p>