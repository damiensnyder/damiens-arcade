<script lang="ts">
  import { eventLog } from "$lib/stores";
</script>

<div>
  {#each $eventLog as event}
    <div>{event}</div>
  {/each}
</div>