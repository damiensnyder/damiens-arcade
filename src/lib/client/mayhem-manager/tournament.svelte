<script lang="ts">
	import Bracket from './bracket.svelte';
	import PickFighters from './pick-fighters.svelte';
	import * as gameStore from './stores.svelte';
	import * as commonStore from '../stores.svelte';

	let ownTeamIndex = $derived(gameStore.getOwnTeamIndex(commonStore.pov));
	let nextMatch = $derived(gameStore.getNextMatch());

	let playingInNextGame = $derived(
		(nextMatch.left.winner === ownTeamIndex || nextMatch.right.winner === ownTeamIndex) &&
			nextMatch.winner === null
	);

	function advance(): void {
		commonStore.sendAction({ type: 'advance' });
	}
</script>

{#if playingInNextGame}
	<PickFighters />
{/if}
<div class="column" style:flex="3">
	<h2 class="column-title">Bracket</h2>
	<div class="bracket">
		<Bracket {...gameStore.bracket} />
	</div>

	{#if commonStore.host === commonStore.pov && gameStore.teams[nextMatch.left?.winner ?? -1]?.controller === 'bot' && gameStore.teams[nextMatch.right?.winner ?? -1]?.controller === 'bot'}
		<div class="horiz">
			<button onclick={advance} onsubmit={advance}>start fight</button>
			<div class="bot-vs-bot">(match is bot vs bot)</div>
		</div>
	{/if}
</div>

<style>
	.bracket {
		overflow: scroll;
	}

	.bot-vs-bot {
		margin: 1rem 1rem 0;
	}
</style>
