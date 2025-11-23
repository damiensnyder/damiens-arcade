<script lang="ts">
	import type { Team } from '$lib/shared/mayhem-manager/types';
	import FighterInfo from './fighter-info.svelte';
	import EquipmentInfo from './equipment-info.svelte';

	let { team }: { team: Team } = $props();
</script>

<div class="column" style:flex="1">
	<h2 class="column-title">Fighters</h2>
	<div class="fighters">
		{#each team.fighters as fighter}
			<FighterInfo {fighter} />
		{/each}
	</div>
</div>
<div class="column" style:flex="1">
	<h2 class="column-title">Equipment</h2>
	<div class="fighters">
		{#each team.equipment as equipment}
			<EquipmentInfo {equipment} />
		{/each}
	</div>
</div>
