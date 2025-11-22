<script lang="ts">
	import { page } from '$app/stores';
	import { onMount, onDestroy } from 'svelte';
	import { AuctionTTTState } from '$lib/games/auction-ttt/state.svelte';
	import { Side } from '$lib/shared/auction-ttt/types';

	const roomCode = $page.params.roomCode.toUpperCase();
	const gameState = new AuctionTTTState(roomCode);

	onMount(() => {
		gameState.connect();
	});

	onDestroy(() => {
		gameState.disconnect();
	});

	function join(side: Side.X | Side.O) {
		gameState.sendAction({ type: 'join', side });
	}

	function leave() {
		gameState.sendAction({ type: 'leave' });
	}

	function startGame() {
		gameState.sendAction({ type: 'start' });
	}

	function nominate(row: number, col: number) {
		if (!gameState.state || gameState.state.gameStage !== 'midgame') return;
		const bid = gameState.currentBid || 0;
		gameState.sendAction({ type: 'nominate', square: [row, col], startingBid: bid });
		gameState.currentBid = null;
	}

	function bid() {
		if (gameState.currentBid === null) return;
		gameState.sendAction({ type: 'bid', amount: gameState.currentBid });
	}

	function pass() {
		gameState.sendAction({ type: 'pass' });
	}

	function rematch() {
		gameState.sendAction({ type: 'rematch' });
	}
</script>

<svelte:head>
	<title>Auction Tic-Tac-Toe | {roomCode}</title>
</svelte:head>

<div class="game-container">
	<h1>Auction Tic-Tac-Toe</h1>

	{#if !gameState.connected}
		<p>Connecting to room {roomCode}...</p>
	{:else if !gameState.state}
		<p>Loading game state...</p>
	{:else}
		{@const state = gameState.state}

		<!-- Room info -->
		<div class="room-info">
			<p>Room: {state.roomName} ({state.roomCode})</p>
			<p>You are: {state.pov === state.host ? 'Host' : 'Guest'}</p>
			<p>Your side: {gameState.mySide}</p>
		</div>

		<!-- Pregame -->
		{#if state.gameStage === 'pregame'}
			<div class="pregame">
				<h2>Waiting to start...</h2>

				<div class="player-select">
					<div>
						<h3>Player X</h3>
						{#if state.players.X.controller !== undefined}
							<p>Joined</p>
							{#if gameState.mySide === Side.X}
								<button onclick={leave}>Leave</button>
							{/if}
						{:else}
							<button onclick={() => join(Side.X)}>Join as X</button>
						{/if}
					</div>

					<div>
						<h3>Player O</h3>
						{#if state.players.O.controller !== undefined}
							<p>Joined</p>
							{#if gameState.mySide === Side.O}
								<button onclick={leave}>Leave</button>
							{/if}
						{:else}
							<button onclick={() => join(Side.O)}>Join as O</button>
						{/if}
					</div>
				</div>

				{#if state.pov === state.host && state.players.X.controller !== undefined && state.players.O.controller !== undefined}
					<button onclick={startGame}>Start Game</button>
				{/if}
			</div>
		<!-- Midgame -->
		{:else if state.gameStage === 'midgame'}
			<div class="midgame">
				<div class="players-info">
					<div>
						<h3>Player X</h3>
						<p>Money: ${state.players.X.money}</p>
					</div>
					<div>
						<h3>Player O</h3>
						<p>Money: ${state.players.O.money}</p>
					</div>
				</div>

				<div class="board">
					{#each state.squares as row, i}
						{#each row as cell, j}
							<button
								class="square"
								class:X={cell === Side.X}
								class:O={cell === Side.O}
								onclick={() => nominate(i, j)}
								disabled={cell !== Side.None || !gameState.isMyTurn || state.turnPart !== 'nominating'}
							>
								{cell === Side.None ? '' : cell}
							</button>
						{/each}
					{/each}
				</div>

				{#if state.turnPart === 'bidding' && gameState.isMyTurn}
					<div class="bidding">
						<p>Current bid: ${state.lastBid}</p>
						<input
							type="number"
							bind:value={gameState.currentBid}
							min={state.lastBid! + 1}
							max={gameState.myPlayer?.money || 0}
						/>
						<button onclick={bid}>Bid</button>
						<button onclick={pass}>Pass</button>
					</div>
				{:else if state.turnPart === 'nominating' && gameState.isMyTurn}
					<div class="nominating">
						<p>Your turn to nominate a square</p>
						<label>
							Starting bid: $
							<input
								type="number"
								bind:value={gameState.currentBid}
								min={0}
								max={gameState.myPlayer?.money || 0}
							/>
						</label>
					</div>
				{:else}
					<p>Waiting for opponent...</p>
				{/if}
			</div>
		<!-- Postgame -->
		{:else}
			<div class="postgame">
				<h2>Game Over!</h2>
				{#if state.winner.winningSide === Side.None}
					<p>It's a tie!</p>
				{:else}
					<p>{state.winner.winningSide} wins!</p>
				{/if}

				<div class="board">
					{#each state.squares as row, i}
						{#each row as cell, j}
							<div
								class="square"
								class:X={cell === Side.X}
								class:O={cell === Side.O}
							>
								{cell === Side.None ? '' : cell}
							</div>
						{/each}
					{/each}
				</div>

				{#if state.pov === state.host}
					<button onclick={rematch}>Rematch</button>
				{/if}
			</div>
		{/if}

		<!-- Event log -->
		<div class="event-log">
			<h3>Event Log</h3>
			<ul>
				{#each gameState.eventLog as event}
					<li>{event}</li>
				{/each}
			</ul>
		</div>
	{/if}
</div>

<style>
	.game-container {
		max-width: 800px;
		margin: 0 auto;
		padding: 2rem;
	}

	.room-info {
		margin-bottom: 1rem;
		padding: 1rem;
		background: #f0f0f0;
		border-radius: 4px;
	}

	.player-select {
		display: flex;
		gap: 2rem;
		margin: 2rem 0;
	}

	.player-select > div {
		flex: 1;
		padding: 1rem;
		border: 2px solid #333;
		border-radius: 4px;
	}

	.board {
		display: grid;
		grid-template-columns: repeat(3, 100px);
		grid-template-rows: repeat(3, 100px);
		gap: 4px;
		margin: 2rem auto;
		width: fit-content;
	}

	.square {
		width: 100px;
		height: 100px;
		font-size: 2rem;
		font-weight: bold;
		border: 2px solid #333;
		background: white;
		cursor: pointer;
	}

	.square:disabled {
		cursor: not-allowed;
		opacity: 0.6;
	}

	.square.X {
		background: #ff6b6b;
		color: white;
	}

	.square.O {
		background: #4ecdc4;
		color: white;
	}

	.players-info {
		display: flex;
		gap: 2rem;
		justify-content: center;
	}

	.bidding, .nominating {
		text-align: center;
		margin: 2rem 0;
	}

	.bidding input, .nominating input {
		width: 100px;
		margin: 0 0.5rem;
	}

	.event-log {
		margin-top: 2rem;
		padding: 1rem;
		background: #f9f9f9;
		border-radius: 4px;
		max-height: 200px;
		overflow-y: auto;
	}

	.event-log ul {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.event-log li {
		padding: 0.25rem 0;
		font-size: 0.9rem;
	}
</style>
