<script lang="ts">
	import EquipmentInfo from './equipment-info.svelte';
	import FighterInfo from './fighter-info.svelte';
	import { StatName, type Equipment, type Fighter, type FighterStats } from '$lib/shared/mayhem-manager/types';
	import * as gameStore from './stores.svelte';
	import * as commonStore from '../stores.svelte';

	let ownTeamIndex = $derived(gameStore.getOwnTeamIndex(commonStore.pov));
	let ownTeam = $derived(gameStore.getOwnTeam(commonStore.pov));

	let equipmentBought = $state<number[]>([]);
	let skills = $state<(keyof FighterStats | number)[]>(
		ownTeamIndex === null
			? []
			: ownTeam
				? Array(ownTeam.fighters.length).fill('toughness')
				: []
	);

	function pick(index: number) {
		equipmentBought.push(index);
		const e = gameStore.equipment.splice(index, 1)[0];

		// Update the team's equipment and money
		const newTeams = [...gameStore.teams];
		if (ownTeamIndex !== null) {
			newTeams[ownTeamIndex].equipment.push(e);
			newTeams[ownTeamIndex].money -= e.price;
		}
		gameStore.teams = newTeams;
		gameStore.equipment = [...gameStore.equipment];
	}

	// Submit the equipment you're buying and skills you're training
	function practice() {
		commonStore.sendAction({
			type: 'practice',
			equipment: equipmentBought,
			skills
		});

		// Update the fighters' stats and attunements after training
		if (ownTeam) {
			ownTeam.fighters.forEach((f, i) => {
				if (typeof skills[i] === 'number') {
					f.attunements.push(ownTeam.equipment[skills[i]].name);
				} else {
					f.stats[skills[i]] += 1;
				}
			});
			gameStore.teams = [...gameStore.teams];
		}
	}

	// Filters out repeat equipment and already-attuned equipment
	function attunableEquipment(equipment: Equipment[], fighter: Fighter): Equipment[] {
		return [...new Set(equipment)].filter((e) => !fighter.attunements.includes(e.name));
	}
</script>

{#if ownTeamIndex !== null && ownTeam}
	<div class="column" style:flex="2">
		<h2 class="column-title">Equipment</h2>
		<div class="equipment">
			{#each gameStore.equipment as equipment, index}
				<EquipmentInfo {equipment} {index} callback={pick} />
			{/each}
		</div>
	</div>
	<div class="column" style:flex="1">
		<h2 class="column-title">Select training</h2>
		<div class="list-container">
			{#each ownTeam.fighters as fighter, index}
				<div class="horiz text-and-buttons">
					<div class="show-child-on-hover">
						{fighter.name}
						<div class="show-on-hover">
							<FighterInfo {fighter} />
						</div>
					</div>
					<div class="right-align-outer">
						<select class="right-align-inner" bind:value={skills[index]}>
							<optgroup label="Improve a skill">
								{#each Object.values(StatName) as stat}
									<option value={stat}>{stat}</option>
								{/each}
							</optgroup>
							<optgroup label="Attune to an equipment">
								{#each attunableEquipment(ownTeam.equipment, fighter) as equipment, equipIdx}
									<option value={equipIdx}>{equipment.name}</option>
								{/each}
							</optgroup>
						</select>
					</div>
				</div>
			{/each}
		</div>

		<button class="ready" onclick={practice} onsubmit={practice}>Ready!</button>

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

		<h2>Your equipment</h2>

		<div class="list-container">
			{#each ownTeam.equipment as equipment}
				<div class="show-child-on-hover">
					{equipment.name}
					<div class="show-on-hover">
						<EquipmentInfo {equipment} />
					</div>
				</div>
			{/each}
		</div>
	</div>
{/if}

<style>
	.equipment {
		align-self: stretch;
		align-items: stretch;
	}

	select {
		min-width: auto;
	}

	.ready {
		margin: 0.75rem;
	}

	.list-container {
		margin-top: -0.5rem;
	}
</style>
