<script lang="ts">
	import EquipmentInfo from './equipment-info.svelte';
	import FighterInfo from './fighter-info.svelte';
	import FighterImage from './fighter-image.svelte';
	import { EquipmentSlot } from '$lib/shared/mayhem-manager/types';
	import { slotsToString } from '$lib/shared/mayhem-manager/utils';
	import { gameStore } from './stores.svelte';
	import { commonStore } from '../stores.svelte';

	let ownTeam = $derived(gameStore.getOwnTeam(commonStore.pov));

	function readyUp(): void {
		if (!ownTeam) return;
		commonStore.sendAction({
			type: 'pickFighters',
			equipment: ownTeam.fighters.map((_, i) =>
				gameStore.equipmentChoices.map((ec, j) => (ec === i ? j : -1)).filter((ec) => ec >= 0)
			)
		});
	}

	function choicesAreValid(): string | true {
		if (!ownTeam) return 'No team';
		for (let i = 0; i < ownTeam.fighters.length; i++) {
			const slotsTaken = gameStore.equipmentChoices.flatMap((ec, j) => {
				return ec === i ? ownTeam.equipment[j].slots : [];
			});
			if (slotsTaken.filter((s) => s === EquipmentSlot.Head).length > 1) {
				return `${ownTeam.fighters[i].name} has multiple items on their head.`;
			} else if (slotsTaken.filter((s) => s === EquipmentSlot.Hand).length > 2) {
				return `${ownTeam.fighters[i].name} has more than two items in their hands.`;
			} else if (slotsTaken.filter((s) => s === EquipmentSlot.Torso).length > 1) {
				return `${ownTeam.fighters[i].name} has multiple items on their torso.`;
			} else if (slotsTaken.filter((s) => s === EquipmentSlot.Legs).length > 1) {
				return `${ownTeam.fighters[i].name} has multiple items on their legs.`;
			} else if (slotsTaken.filter((s) => s === EquipmentSlot.Feet).length > 1) {
				return `${ownTeam.fighters[i].name} has multiple items on their feet.`;
			}
		}
		return true;
	}
</script>

{#if ownTeam}
	<div class="assign-equipment column" style:flex="2">
		<h2 class="column-title">Assign equipment</h2>
		<div class="fighters-container">
			{#each ownTeam.fighters as fighter, i}
				<div class="fighter">
					<div class="show-child-on-hover">
						<FighterImage
							{fighter}
							equipment={gameStore.equipmentChoices.flatMap((ec, j) => {
								if (ec === i) return ownTeam.equipment[j];
								return [];
							})}
						/>
						<div class="show-on-hover">
							<FighterInfo {fighter} />
						</div>
					</div>
				</div>
			{/each}
		</div>
		{#each ownTeam.equipment as equipment, i}
			<div class="show-child-on-hover horiz">
				<span>{equipment.name} ({slotsToString(equipment.slots)})</span>
				<div class="show-on-hover">
					<EquipmentInfo {equipment} />
				</div>
				<select bind:value={gameStore.equipmentChoices[i]}>
					<option value={-1}>no one</option>
					{#each ownTeam.fighters as f, j}
						<option value={j}>
							{f.name}
							{f.attunements.includes(equipment.name) ? ' (attuned)' : ''}
						</option>
					{/each}
				</select>
			</div>
		{/each}
		{#if choicesAreValid() === true}
			<button class="ready" onclick={readyUp} onsubmit={readyUp}>Ready</button>
		{:else}
			<p class="error">Cannot submit: {choicesAreValid()}</p>
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
	.column {
		overflow-x: hidden;
	}

	.fighters-container {
		flex-flow: wrap;
	}

	.fighter {
		max-width: 50%;
		margin: 0;
		padding: 0;
	}

	.show-child-on-hover {
		align-self: stretch;
		justify-content: space-between;
	}

	.show-on-hover {
		left: unset;
		right: 1rem;
	}

	.ready {
		margin-bottom: 1.25rem;
	}

	select {
		min-width: auto;
	}
</style>
