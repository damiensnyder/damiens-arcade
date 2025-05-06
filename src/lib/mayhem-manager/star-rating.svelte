<script lang="ts">
  export let rating: number;
  export let oldRating: number = -1;
  if (oldRating === -1) {
    oldRating = rating;
  }
  $: starSize = window.innerWidth > 720 ? window.innerWidth > 1200 ? "20px" : "18px" : "15px";
  const starSvg = "M5 7.457 L8.09 9.51 L7.092 5.937 L10 3.632 L6.293 3.477 L5 0 L3.707 3.477 L0 3.632 L2.908 5.937 L1.91 9.51 L5 7.457 Z";
  const filledColor = "#ec6";
  const formerlyFilledColor = "#b99";
  const newlyFilledColor = "#e66";
  const unfilledColor = "#808080";
</script>

<div class="horiz">
  {#each [1, 3, 5, 7, 9] as num}
    {#if rating > num}
      {#if oldRating > num}
        <svg width={starSize} height={starSize} viewBox="0 0 10 10">
          <path fill={filledColor} d={starSvg} />
        </svg>
      {:else if oldRating === num}
        <svg width={starSize} height={starSize} viewBox="0 0 10 10">
          <defs>
            <linearGradient id="grad-filled-newly">
              <stop offset="50%" stop-color={filledColor}/>
              <stop offset="50%" stop-color={newlyFilledColor}/>
            </linearGradient>
          </defs>
          <path fill="url(#grad-filled-newly)" d={starSvg} />
        </svg>
      {:else}
        <svg width={starSize} height={starSize} viewBox="0 0 10 10">
          <path fill={newlyFilledColor} d={starSvg} />
        </svg>
      {/if}
    {:else if rating === num}
      {#if oldRating > num}
        <svg width={starSize} height={starSize} viewBox="0 0 10 10">
          <defs>
            <linearGradient id="grad-filled-formerly">
              <stop offset="50%" stop-color={filledColor}/>
              <stop offset="50%" stop-color={formerlyFilledColor}/>
            </linearGradient>
          </defs>
          <path fill="url(#grad-filled-formerly)" d={starSvg} />
        </svg>
      {:else if oldRating === num}
        <svg width={starSize} height={starSize} viewBox="0 0 10 10">
          <defs>
            <linearGradient id="grad-filled-unfilled">
              <stop offset="50%" stop-color={filledColor}/>
              <stop offset="50%" stop-color={unfilledColor}/>
            </linearGradient>
          </defs>
          <path fill="url(#grad-filled-unfilled)" d={starSvg} />
        </svg>
      {:else}
        <svg width={starSize} height={starSize} viewBox="0 0 10 10">
          <defs>
            <linearGradient id="grad-newly-unfilled">
              <stop offset="50%" stop-color={newlyFilledColor}/>
              <stop offset="50%" stop-color={unfilledColor}/>
            </linearGradient>
          </defs>
          <path fill="url(#grad-newly-unfilled)" d={starSvg} />
        </svg>
      {/if}
    {:else}
      {#if oldRating > num}
        <svg width={starSize} height={starSize} viewBox="0 0 10 10">
          <path fill={formerlyFilledColor} d={starSvg} />
        </svg>
      {:else if oldRating === num}
        <svg width={starSize} height={starSize} viewBox="0 0 10 10">
          <defs>
            <linearGradient id="grad-formerly-unfilled">
              <stop offset="50%" stop-color={formerlyFilledColor}/>
              <stop offset="50%" stop-color={unfilledColor}/>
            </linearGradient>
          </defs>
          <path fill="url(#grad-formerly-unfilled)" d={starSvg} />
        </svg>
      {:else}
        <svg width={starSize} height={starSize} viewBox="0 0 10 10">
          <path fill={unfilledColor} d={starSvg} />
        </svg>
      {/if}
    {/if}
  {/each}
</div>