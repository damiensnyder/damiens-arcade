<script lang="ts">
  import { lastAction } from "$lib/stores";

  function start() {
    lastAction.set({
      type: "join"
    });
  }

  function leave() {
    lastAction.set({
      type: "leave"
    });
  }
</script>

<div>
  <!-- really there should be a separate thing if you haven't joined or if it is the 1st season -->
  <h2>Re-sign and repair</h2>
</div>
<div>
  <h2>Players</h2>
  <div class="horiz">
    <button on:click={start} on:submit={start}>Join</button>
    <button on:click={leave} on:submit={leave}>Leave</button>
  </div>
</div>

<style>

</style>