<script lang="ts">
  export let body: string;
  export let head: string;
  export let torso: string;
  export let hands: [string, string];
  export let legs: string;
  export let feet: string;
</script>

<!-- svelte-ignore a11y-missing-attribute -->
<div class="img-container">
  <img src={body} />
  <img src={head} class="body-part" />
  <img src={torso} class="body-part" />
  <img src={hands[0]} class="body-part" />
  <img src={hands[1]} class="body-part" />
  <img src={legs} class="body-part" />
  <img src={feet} class="body-part" />
</div>

<style>
  .img-container {
    position: relative;
    z-index: 0;
  }

  .body-part {
    position: absolute;
    z-index: 1;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
  }
</style>