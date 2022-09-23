<script lang="ts">
  import Bracket from "$lib/tourney/bracket.svelte";
  import { bracket } from "$lib/tourney/stores";
</script>

<div>
  <h2>Bracket</h2>
  <Bracket {...$bracket} />
</div>