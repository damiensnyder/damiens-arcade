<script lang="ts">
  export let rating: number;
</script>

<div class="horiz">
  {#each [1, 3, 5, 7, 9] as num}
    {#if rating > num}
      <svg width="20px" height="20px" viewBox="0 0 10 10">
        <path fill="#ec6" d="M5 7.457 L8.09 9.51 L7.092 5.937 L10 3.632 L6.293 3.477 L5 0 L3.707 3.477 L0 3.632 L2.908 5.937 L1.91 9.51 L5 7.457 Z"/>
      </svg>
    {:else if rating === num}
      <svg width="20px" height="20px" viewBox="0 0 10 10">
        <defs>
          <linearGradient id="grad">
            <stop offset="50%" stop-color="#ec6"/>
            <stop offset="50%" stop-color="#888"/>
          </linearGradient>
        </defs>
        <path fill="url(#grad)" d="M5 7.457 L8.09 9.51 L7.092 5.937 L10 3.632 L6.293 3.477 L5 0 L3.707 3.477 L0 3.632 L2.908 5.937 L1.91 9.51 L5 7.457 Z"/>
      </svg>
    {:else}
      <svg width="20px" height="20px" viewBox="0 0 10 10">
        <path fill="#888" d="M5 7.457 L8.09 9.51 L7.092 5.937 L10 3.632 L6.293 3.477 L5 0 L3.707 3.477 L0 3.632 L2.908 5.937 L1.91 9.51 L5 7.457 Z"/>
      </svg>
    {/if}
  {/each}
</div>