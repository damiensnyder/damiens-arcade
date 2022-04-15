<script lang="ts">
  import { eventLog } from "$lib/stores";
</script>

<div class="outer">
  <div class="inner">
    {#each $eventLog as event}
      <div class="event">{event}</div>
    {/each}
  </div>
</div>

<style>
  .outer {
    position: fixed;
    right: 2rem;
    bottom: 3rem;
    width: 18rem;
    max-height: 5rem;
    padding: 0.2rem;
    border-radius: 8px;
    justify-content: end;
    color: var(--text-4);
    border: 2px solid transparent;
    overflow-y: scroll;
    opacity: 70%;
    transition: all 0.2s ease-in-out;
  }

  .inner {
    align-items: flex-start;
  }

  .event {
    text-align: left;
    margin: 0.15rem;
  }

  .outer:hover {
    background-color: var(--bg-3);
    border: 2px solid var(--bg-5);
    opacity: 90%;
    transition: all 0.2s ease-in-out;
  }
</style>