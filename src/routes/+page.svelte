<script lang="ts">
	const games = [
		{
			id: 'auction-ttt',
			name: 'Auction Tic-Tac-Toe',
			description: 'Bid on squares to claim them in this strategic twist on tic-tac-toe',
			players: '2 players',
			duration: '5-10 min',
			available: true
		},
		{
			id: 'mayhem-manager',
			name: 'Mayhem Manager',
			description: 'Build a team of fighters and compete in tournaments',
			players: '2-8 players',
			duration: '30-60 min',
			available: false // Not yet ported
		},
		{
			id: 'daily-qless',
			name: 'Daily Q-less',
			description: "Today's crossword puzzle without the letter Q",
			players: 'Solo',
			duration: '5-15 min',
			available: false // Not yet ported
		}
	];
</script>

<svelte:head>
	<title>Damien's Arcade</title>
</svelte:head>

<div class="homepage">
	<header>
		<h1>Damien's Arcade</h1>
		<p>Multiplayer games for you and your friends</p>
	</header>

	<div class="game-grid">
		{#each games as game}
			<a
				href={game.available ? `/${game.id}` : '#'}
				class="game-card"
				class:disabled={!game.available}
			>
				<h2>{game.name}</h2>
				<p class="description">{game.description}</p>
				<div class="meta">
					<span>{game.players}</span>
					<span>{game.duration}</span>
				</div>
				{#if !game.available}
					<span class="coming-soon">Coming Soon</span>
				{/if}
			</a>
		{/each}
	</div>
</div>

<style>
	.homepage {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
	}

	header {
		text-align: center;
		margin-bottom: 4rem;
	}

	header h1 {
		font-size: 3rem;
		margin-bottom: 0.5rem;
	}

	header p {
		font-size: 1.2rem;
		color: #666;
	}

	.game-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 2rem;
	}

	.game-card {
		position: relative;
		padding: 2rem;
		border: 2px solid #333;
		border-radius: 8px;
		text-decoration: none;
		color: inherit;
		transition: transform 0.2s, box-shadow 0.2s;
	}

	.game-card:not(.disabled):hover {
		transform: translateY(-4px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}

	.game-card.disabled {
		opacity: 0.6;
		cursor: not-allowed;
		background: #f5f5f5;
	}

	.game-card h2 {
		margin-bottom: 1rem;
	}

	.description {
		color: #666;
		margin-bottom: 1.5rem;
		min-height: 3rem;
	}

	.meta {
		display: flex;
		justify-content: space-between;
		font-size: 0.9rem;
		color: #888;
	}

	.coming-soon {
		position: absolute;
		top: 1rem;
		right: 1rem;
		padding: 0.25rem 0.75rem;
		background: #ffeb3b;
		color: #333;
		border-radius: 4px;
		font-size: 0.8rem;
		font-weight: bold;
	}
</style>
