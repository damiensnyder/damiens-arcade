<script lang="ts">
	import type { Bracket } from '$lib/shared/mayhem-manager/types';
	import * as gameStore from './stores.svelte';
	import * as commonStore from '../stores.svelte';

	let {
		left = null,
		right = null,
		winner
	}: {
		left?: Bracket | null;
		right?: Bracket | null;
		winner: number | string | null;
	} = $props();

	let ownTeamIndex = $derived(gameStore.getOwnTeamIndex(commonStore.pov));
	let ownTeam = $derived(gameStore.getOwnTeam(commonStore.pov));

	let winnerShortenedName = $derived(
		winner === null
			? null
			: (typeof winner === 'string' ? winner : gameStore.teams[winner].name).split(' ').pop()
	);

	let isOwnTeam = $derived(
		typeof winner === 'string' ? ownTeam !== null && winner === ownTeam.name : winner === ownTeamIndex
	);
</script>

<div class="horiz">
	<div class="children">
		{#if left !== null}
			<svelte:self {...left} />
		{/if}
		{#if right !== null}
			<svelte:self {...right} />
		{/if}
	</div>
	{#if winner !== null}
		<p class="winner" style:color={isOwnTeam ? 'var(--accent-4)' : 'var(--text-1)'}>
			{winnerShortenedName}
		</p>
	{:else}
		<p class="winner tbd">winner</p>
	{/if}
</div>

<style>
	.children {
		align-items: flex-end;
	}

	.winner {
		width: 6rem;
		padding: 0.5rem;
		text-align: right;
		border-right: 2px solid var(--bg-1);
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
	}

	.tbd {
		color: var(--text-2);
		font-style: italic;
	}
</style>
