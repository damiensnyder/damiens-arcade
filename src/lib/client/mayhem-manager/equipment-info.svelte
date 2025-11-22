<script lang="ts">
	import type { Equipment } from '$lib/shared/mayhem-manager/types';
	import { slotsToString } from '$lib/shared/mayhem-manager/utils';
	import * as gameStore from './stores.svelte';
	import * as commonStore from '../stores.svelte';

	let {
		equipment,
		index = -1,
		callback = (_: number) => {}
	}: {
		equipment: Equipment;
		index?: number;
		callback?: (index: number) => void;
	} = $props();

	let imageSize = $derived.by(() => {
		if (typeof window === 'undefined') return 125;
		return window.innerWidth > 720 ? (window.innerWidth > 1200 ? 150 : 125) : 100;
	});

	function pick(): void {
		if (gameStore.gameStage === 'preseason') {
			commonStore.sendAction({
				type: 'repair',
				equipment: index
			});
		} else {
			callback(index);
		}
	}

	let ownTeam = $derived(gameStore.getOwnTeam(commonStore.pov));
</script>

<div class="horiz top-bar">
	<h3>{equipment.name}</h3>
	<div>
		{slotsToString(equipment.slots)}
		{#if index > -1} &bull; ${equipment.price}{/if}
	</div>
	{#if index > -1 && ownTeam && ownTeam.money >= equipment.price}
		<button onclick={pick} onsubmit={pick}>Pick</button>
	{/if}
</div>
<div class="horiz image-and-description">
	<img src={equipment.zoomedImgUrl} width={imageSize} height={imageSize} alt={equipment.name} />
	<div class="description">
		<p>{equipment.description}</p>
		<p>{equipment.flavor}</p>
	</div>
</div>

<style>
	.top-bar {
		flex: 1;
		align-self: stretch;
		justify-content: space-between;
		align-items: center;
	}

	.top-bar > div,
	.top-bar > button {
		flex-grow: 0;
	}

	.top-bar > div {
		margin-top: 0.5rem;
		margin-left: 1.25rem;
	}

	img {
		margin-right: 1rem;
	}

	h3 {
		flex: 1;
		padding: 0;
	}

	button {
		margin: 0.2rem 0 0 0.75rem;
	}

	.image-and-description {
		align-self: stretch;
		justify-content: stretch;
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
</style>
