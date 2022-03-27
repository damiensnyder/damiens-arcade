<script lang="ts">
  export let size: number;

  $: strokeWidth = 200 / size;
</script>

<svg width={size} height={size} viewBox="-5 -5 110 110">
  <circle cx="50" cy="50" r="50" stroke="#6df" stroke-width={strokeWidth} />
</svg>