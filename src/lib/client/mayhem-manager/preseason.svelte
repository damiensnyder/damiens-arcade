<script lang="ts">
	import type { PreseasonTeam } from '$lib/shared/mayhem-manager/types';
	import FighterInfo from './fighter-info.svelte';
	import EquipmentInfo from './equipment-info.svelte';
	import { gameStore } from './stores.svelte';
	import { commonStore } from '../stores.svelte';

	let needsResigning = $derived.by(() => {
		const ownTeam = gameStore.getOwnTeam(commonStore.pov);
		return ownTeam !== null ? (ownTeam as PreseasonTeam).needsResigning : [];
	});

	let needsRepair = $derived.by(() => {
		const ownTeam = gameStore.getOwnTeam(commonStore.pov);
		return ownTeam !== null ? (ownTeam as PreseasonTeam).needsRepair : [];
	});

	let ownTeamIndex = $derived(gameStore.getOwnTeamIndex(commonStore.pov));

	let teamName = $state('');

	function start() {
		commonStore.sendAction({
			type: 'join',
			name: teamName
		});
	}

	function leave() {
		commonStore.sendAction({
			type: 'leave'
		});
	}

	function replace(team: number) {
		commonStore.sendAction({
			type: 'replace',
			team
		});
	}

	function remove(team: number) {
		commonStore.sendAction({
			type: 'remove',
			team
		});
	}

	function addBot() {
		commonStore.sendAction({
			type: 'addBot'
		});
	}

	function readyUp() {
		commonStore.sendAction({
			type: 'ready'
		});
	}
</script>

<div class="column" style:flex="5">
	{#if ownTeamIndex !== null}
		<h2 class="column-title">Re-sign fighters</h2>
		<div>
			{#each needsResigning as fighter, index}
				<FighterInfo {fighter} {index} />
			{/each}
		</div>
		<h2>Repair equipment</h2>
		<div>
			{#each needsRepair as equipment, index}
				<EquipmentInfo {equipment} {index} />
			{/each}
		</div>
	{:else if gameStore.teams.length < 16}
		<div class="horiz">
			<form>
				<h2>Join the game</h2>
				<label
					>Team name
					<input type="text" bind:value={teamName} maxLength={20} />
				</label>
				<button
					onclick={start}
					onsubmit={start}
					disabled={teamName.trim().length === 0 ||
						gameStore.teams.some((t) => t.name === teamName)}
				>
					Join
				</button>
			</form>
		</div>
	{/if}
</div>
<div class="players-list column" style:flex="4">
	<h2 class="column-title">Players</h2>
	{#each gameStore.teams as team, index}
		<div class="horiz text-and-buttons">
			<span
				class="team-name"
				style:color={index === ownTeamIndex ? 'var(--accent-4)' : 'var(--text-1)'}
			>
				{team.name}: ${team.money}
				{team.controller === 'bot' ? '(bot)' : ''}
			</span>
			<div class="right-align-outer">
				{#if team.controller === 'bot'}
					{#if ownTeamIndex === null}
						<button class="right-align-inner" onclick={() => replace(index)} onsubmit={() => replace(index)}>
							Replace
						</button>
					{/if}
					{#if commonStore.host === commonStore.pov}
						<button class="right-align-inner" onclick={() => remove(index)} onsubmit={() => remove(index)}>
							Remove
						</button>
					{/if}
				{:else if team.controller === commonStore.pov}
					<button class="right-align-inner" onclick={leave} onsubmit={leave}>Leave</button>
				{/if}
			</div>
		</div>
	{/each}
	<div class="horiz controls">
		{#if commonStore.host === commonStore.pov && gameStore.teams.length < 16}
			<button class="right-align-inner" onclick={addBot} onsubmit={addBot}>Add a bot</button>
		{/if}
		{#if ownTeamIndex !== null}
			<button class="right-align-inner" onclick={readyUp} onsubmit={readyUp}>Ready</button>
		{/if}
	</div>
	<div>
		{#if !gameStore.teams.every((t) => t.controller === 'bot')}
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
		{/if}
	</div>
</div>

<style>
	form {
		padding: 0.5rem;
		align-items: center;
	}

	label {
		margin-top: 1.25rem;
	}

	.players-list > .controls {
		align-self: center;
		margin-top: 1rem;
	}

	.team-name {
		flex-grow: 0;
	}
</style>
