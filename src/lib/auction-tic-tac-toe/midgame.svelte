<script lang="ts">
  import Gameboard from "./gameboard.svelte";
  import O from "./o.svelte";
  import X from "./x.svelte";
</script>
  
<div class="horiz">
  <X size={100} />
  <Gameboard />
  <O size={100} />
</div>
<p>You should attempt to win, in this situation.</p>