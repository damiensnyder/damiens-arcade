<script lang="ts">
  import { eventLog } from "$lib/stores";
  import { afterUpdate } from "svelte";

  let innerDiv: HTMLDivElement;
  let disappearTimeout: NodeJS.Timeout;

  function scrollToBottom() {
    innerDiv.scrollTo(0, innerDiv.scrollHeight);
    innerDiv.classList.remove("no-recent-events");
    clearTimeout(disappearTimeout);
    disappearTimeout = setTimeout(
      function() {
        if (innerDiv !== null) {
          innerDiv.classList.add("no-recent-events");
        }
      },
      5000
    );
  }

  // when a new event is added, scroll to it
	afterUpdate(scrollToBottom);
</script>

<div class="outer">
  <div class="shadow">

  </div>
  <div class="inner no-recent-events" bind:this={innerDiv}>
    {#each $eventLog as event}
      <p class="event">{event}</p>
    {/each}
  </div>
</div>

<style>
  .outer {
    position: fixed;
    justify-content: flex-end;
    align-items: stretch;
    right: 2rem;
    bottom: 3rem;
    width: 18rem;
    height: 5rem;
    z-index: 2;
  }
  
  .shadow {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 3rem;
    background: linear-gradient(var(--bg-1), transparent);
    transition: all 0.2s ease-in-out;
    opacity: 100%;
    z-index: 1;
  }

  .outer:hover > .shadow {
    opacity: 0;
    transition: all 0.4s ease-in-out;
  }

  .inner {
    max-height: 100%;
    display: block;
    padding: 0.2rem;
    border-radius: 8px;
    color: var(--text-4);
    border: 2px solid transparent;
    overflow-y: scroll;
    opacity: 75%;
    transition: all 0.4s ease-in-out;
    z-index: 0;
    scrollbar-color: transparent;
    scroll-behavior: auto;
  }

  .no-recent-events {
    opacity: 0%;
    transition: all 0.4s ease-in-out;
  }

  .event {
    text-align: left;
    margin: 0.15rem;
  }

  .outer:hover > .inner {
    background-color: var(--bg-3);
    border: 2px solid var(--bg-5);
    opacity: 90%;
    scroll-behavior: smooth;
    scrollbar-color: var(--text-4);
    transition: all 0.4s ease-in-out;
  }
</style>