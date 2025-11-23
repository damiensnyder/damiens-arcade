<script lang="ts">
	import type { Team } from '$lib/shared/mayhem-manager/types';
	import { gameStore } from './stores.svelte';
	import { commonStore } from '../stores.svelte';

	let { callback }: { callback: (index: number) => () => void } = $props();

	function replace(index: number): void {
		commonStore.sendAction({
			type: 'replace',
			team: index
		});
	}

	function teamText(team: Team, index: number, ownTeamIndex: number | null) {
		let text = team.name;
		if (index === ownTeamIndex) {
			text += ' (you)';
		} else if (team.controller === 'bot') {
			text += ' (bot)';
		}
		text += ': $' + team.money;
		const championships = gameStore.history.filter((b) => b.winner === team.name).length;
		text += ' • ' + championships + ' championship' + (championships === 1 ? '' : 's');
		return text;
	}

	let ownTeamIndex = $derived(gameStore.getOwnTeamIndex(commonStore.pov));
</script>

<div class="column">
	<h2 class="column-title">Teams</h2>
	{#each gameStore.teams as team, index}
		<div class="horiz text-and-buttons">
			{teamText(team, index, ownTeamIndex)}
			<div class="right-align-outer">
				{#if team.controller === 'bot' && ownTeamIndex === null}
					<button class="right-align-inner" onclick={() => replace(index)} onsubmit={() => replace(index)}>
						Replace
					</button>
				{/if}
				<button class="right-align-inner" onclick={callback(index)} onsubmit={callback(index)}>
					View
				</button>
			</div>
		</div>
	{/each}
</div>
