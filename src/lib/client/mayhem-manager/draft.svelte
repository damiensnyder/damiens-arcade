<script lang="ts">
	import FighterInfo from './fighter-info.svelte';
	import { gameStore } from './stores.svelte';
	import { commonStore } from '../stores.svelte';

	function replace(team: number) {
		commonStore.sendAction({
			type: 'replace',
			team
		});
	}

	let ownTeamIndex = $derived(gameStore.getOwnTeamIndex(commonStore.pov));
	let ownTeam = $derived(gameStore.getOwnTeam(commonStore.pov));
</script>

<div class="column" style:flex="2">
	<h2 class="column-title">Fighters</h2>
	<div class="fighters">
		{#each gameStore.fighters as fighter, index}
			<FighterInfo {fighter} {index} />
		{/each}
	</div>
</div>
<div class="column" style:flex="1">
	<h2 class="column-title">Pick Order</h2>
	{#each gameStore.draftOrder as index, spotInOrder}
		<div class="horiz text-and-buttons">
			<span
				class="team-name"
				style:color={index === ownTeamIndex
					? 'var(--accent-4)'
					: spotInOrder === gameStore.spotInDraftOrder
						? 'var(--accent-5)'
						: 'var(--text-1)'}
			>
				{spotInOrder + 1}. {gameStore.teams[index].name}
				{#if spotInOrder === gameStore.spotInDraftOrder}
					are on the clock...
				{/if}
			</span>
			{#if ownTeam === null && gameStore.teams[index].controller === 'bot'}
				<div class="right-align-outer">
					<button class="right-align-inner" onclick={() => replace(index)} onsubmit={() => replace(index)}>
						Replace
					</button>
				</div>
			{/if}
		</div>
	{/each}
</div>

<style>
	.fighters {
		flex: 1;
		align-items: stretch;
	}
</style>
