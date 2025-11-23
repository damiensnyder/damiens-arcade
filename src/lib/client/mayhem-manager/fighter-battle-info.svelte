<script lang="ts">
	import FighterImage from './fighter-image.svelte';
	import FighterInfo from './fighter-info.svelte';
	import { gameStore } from './stores.svelte';
	import { commonStore } from '../stores.svelte';

	let { fighter }: { fighter: any } = $props();

	let ownTeamIndex = $derived(gameStore.getOwnTeamIndex(commonStore.pov));
</script>

<div class="horiz outer-container">
	<div class="image-container">
		<FighterImage {fighter} equipment={fighter.equipment} inBattle={true} />
	</div>
	<div class="info">
		<div class="info name horiz">
			<div class="show-child-on-hover">
				<!-- we check for null because, if we watch a fight from a different
          league for debug purposes, the number of teams might be different -->
				<span
					class="team-name"
					style:color={fighter.team === ownTeamIndex ? 'var(--accent-4)' : 'var(--text-1)'}
				>
					{fighter.name} &bull; {gameStore.teams[fighter.team] == null
						? fighter.team
						: gameStore.teams[fighter.team].name}
				</span>
				<div class="show-on-hover">
					<FighterInfo {fighter} />
				</div>
			</div>
		</div>
		<div class="info">
			{#if fighter.hp > 0}
				HP: {fighter.hp} / 100
			{:else}
				downed
			{/if}
		</div>
	</div>
</div>

<style>
	.outer-container {
		align-self: stretch;
		margin-top: 0.5rem;
		background-color: var(--bg-4);
		border: 2px solid var(--bg-1);
		border-radius: 0.75rem;
	}

	.info {
		align-items: flex-start;
	}

	.name {
		font-weight: 500;
	}

	.image-container {
		width: 5rem;
		height: 5rem;
		flex-shrink: 0;
	}
</style>
