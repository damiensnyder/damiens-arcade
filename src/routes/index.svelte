<script lang="ts">
import CreateMenu from "$lib/create-menu.svelte";
import JoinMenu from "$lib/join-menu.svelte";
import "../styles/global.css";
</script>

<h1>Damien's Arcade</h1>
<div class="horiz">
  <CreateMenu />
  <JoinMenu />
</div>

<style>
  .horiz {
    width: 100%;
    justify-content: center;
    align-items: flex-start;
  }

  :global(.top-level-menu) {
    width: 25%;
  }
</style>