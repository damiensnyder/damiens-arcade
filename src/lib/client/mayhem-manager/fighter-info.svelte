<script lang="ts">
	import type { Equipment, Fighter, FighterStats } from '$lib/shared/mayhem-manager/types';
	import { StatName } from '$lib/shared/mayhem-manager/types';
	import StarRating from './star-rating.svelte';
	import FighterImage from './fighter-image.svelte';
	import * as gameStore from './stores.svelte';
	import * as commonStore from '../stores.svelte';

	let {
		fighter,
		index = -1,
		equipment = []
	}: {
		fighter: Fighter;
		index?: number;
		equipment?: Equipment[];
	} = $props();

	let isTurnToPick = $derived(
		index > -1 &&
			(gameStore.gameStage === 'preseason' ||
				gameStore.draftOrder[gameStore.spotInDraftOrder] ===
					gameStore.getOwnTeamIndex(commonStore.pov))
	);

	let ownTeam = $derived(gameStore.getOwnTeam(commonStore.pov));

	function tooltip(stat: StatName, value: number): string {
		value = Math.round(value);
		if (stat === StatName.Strength) {
			return `Deals ${0.5 + 0.1 * value}x base damage with melee weapons`;
		} else if (stat === StatName.Accuracy) {
			return `Hits ${25 + 5 * value}% of ranged attacks`;
		} else if (stat === StatName.Energy) {
			return `Takes ${6 - 0.4 * value} seconds to charge`;
		} else if (stat === StatName.Speed) {
			return `Moves ${4 + 0.8 * value} m/s; ${2 * value}% dodge chance on melee attacks`;
		} else {
			return `Incoming damage is multiplied by ${1.25 - 0.05 * value}`;
		}
	}

	function pick(): void {
		if (gameStore.gameStage === 'preseason') {
			commonStore.sendAction({
				type: 'resign',
				fighter: index
			});
		} else {
			commonStore.sendAction({
				type: 'pick',
				index
			});
		}
	}
</script>

<div class="horiz top-bar">
	<h3>{fighter.name}</h3>
	<div class="horiz">
		<span class="age">age {21 + fighter.experience}</span>
		{#if isTurnToPick}
			<button onclick={pick} onsubmit={pick} disabled={ownTeam && ownTeam.money < fighter.price}
				>Pick{#if fighter.price > 0}
					: ${fighter.price}
				{/if}</button
			>
		{/if}
	</div>
</div>
<div class="horiz">
	<FighterImage {fighter} {equipment} />
	<div class="horiz info">
		<div class="stats">
			{#each Object.entries(StatName) as statEntry}
				<div
					class="horiz stat-name"
					title={tooltip(statEntry[1], fighter.stats[statEntry[1]])}
				>
					{statEntry[1]}&nbsp;<StarRating
						rating={fighter.stats[statEntry[1]]}
						oldRating={(fighter.oldStats ?? fighter.stats)[statEntry[1]]}
					/>
				</div>
			{/each}
		</div>
		<div class="description">
			<p>{fighter.description}</p>
			<p>{fighter.flavor}</p>
		</div>
	</div>
</div>

<style>
	.top-bar {
		align-self: stretch;
		justify-content: space-between;
	}

	h3 {
		padding: 0;
	}

	button {
		margin: 0.15rem 0 0 1rem;
	}

	.stats {
		align-items: stretch;
		margin: 0 0.5rem 0.5rem 0;
	}

	.stat-name {
		flex: 1;
		justify-content: space-between;
		text-transform: capitalize;
	}

	.info {
		align-items: stretch;
	}

	.description {
		flex: 1;
		justify-content: start;
		align-items: flex-start;
		margin: 0 0 0.5rem 0.5rem;
	}

	p {
		margin: 0 0 0.25rem 0;
	}

	p:last-child {
		margin: 0;
		font-style: italic;
	}

	.age {
		margin-top: 0.25rem;
	}
</style>
