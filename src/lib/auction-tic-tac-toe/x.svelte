<script lang="ts">
  export let size: number;

  $: strokeWidth = 200 / size;
</script>

<svg width={size} height={size} viewBox="-5 -5 110 110">
  <line x1="0" y1="0" x2="100" y2="100" stroke="#f6a" stroke-width={strokeWidth} />
  <line x1="100" y1="0" x2="0" y2="100" stroke="#f6a" stroke-width={strokeWidth} />
</svg>