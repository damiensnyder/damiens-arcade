<script lang="ts">
	import EquipmentInfo from './equipment-info.svelte';
	import FighterInfo from './fighter-info.svelte';
	import { slotsToString } from '$lib/shared/mayhem-manager/utils';
	import * as gameStore from './stores.svelte';
	import * as commonStore from '../stores.svelte';

	let ownTeamIndex = $derived(gameStore.getOwnTeamIndex(commonStore.pov));
	let ownTeam = $derived(gameStore.getOwnTeam(commonStore.pov));

	let selectedFighter = $state(0);
	let selectedEquipment = $state<boolean[]>(
		ownTeamIndex === null || !ownTeam ? [] : Array(ownTeam.equipment.length).fill(false)
	);

	let slotsTaken = $derived(
		selectedEquipment.flatMap((e, i) => {
			return e && ownTeam ? ownTeam.equipment[i].slots : [];
		})
	);

	function readyUp(): void {
		commonStore.sendAction({
			type: 'pickBRFighter',
			fighter: selectedFighter,
			equipment: selectedEquipment.flatMap((x, i) => (x ? [i] : []))
		});
	}
</script>

{#if ownTeamIndex !== null && ownTeam}
	<div class="column" style:flex="2">
		<h2 class="column-title">Select fighter</h2>
		<select bind:value={selectedFighter}>
			{#each ownTeam.fighters as fighter, index}
				<option value={index}>{fighter.name}</option>
			{/each}
		</select>
		<FighterInfo
			fighter={ownTeam.fighters[selectedFighter]}
			equipment={ownTeam.equipment.filter((_, i) => selectedEquipment[i])}
		/>
	</div>
	<div class="column" style:flex="1">
		<h2 class="column-title">Your equipment</h2>
		{#each ownTeam.equipment as equipment, index}
			<div class="show-child-on-hover horiz">
				<span
					style:font-weight={ownTeam.fighters[selectedFighter].attunements.includes(equipment.name)
						? 600
						: 400}
				>
					{equipment.name} ({slotsToString(equipment.slots)})
				</span>
				<div class="show-on-hover">
					<EquipmentInfo {equipment} />
				</div>
				<input type="checkbox" bind:checked={selectedEquipment[index]} />
			</div>
		{/each}
		{#if slotsTaken.filter((s) => s === 'hand').length > 2}
			<p>Cannot submit: Equipment chosen takes up more than 2 hands.</p>
		{:else if slotsTaken.filter((s) => s === 'head').length > 1}
			<p>Cannot submit: Too many equipment chosen that take up the head.</p>
		{:else if slotsTaken.filter((s) => s === 'torso').length > 1}
			<p>Cannot submit: Too many equipment chosen that take up the torso.</p>
		{:else if slotsTaken.filter((s) => s === 'legs').length > 1}
			<p>Cannot submit: Too many equipment chosen that take up the legs.</p>
		{:else if slotsTaken.filter((s) => s === 'feet').length > 1}
			<p>Cannot submit: Too many equipment chosen that take up the feet.</p>
		{:else}
			<button onclick={readyUp} onsubmit={readyUp}>Ready</button>
		{/if}

		<div>
			Waiting for:
			{gameStore.teams
				.map((team, i) => {
					return {
						name: team.name,
						unready: gameStore.teams[i].controller !== 'bot' && !gameStore.ready[i]
					};
				})
				.filter((t) => t.unready)
				.map((t) => t.name)
				.join(', ')}
		</div>
	</div>
{/if}

<style>
	select {
		flex: 0;
	}

	.show-child-on-hover {
		align-self: stretch;
		justify-content: space-between;
	}

	input[type='checkbox'] {
		margin: 0.15rem 0.6rem 0;
	}
</style>
