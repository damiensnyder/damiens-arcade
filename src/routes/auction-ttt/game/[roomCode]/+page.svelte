<script lang="ts">
	import { page } from '$app/stores';
	import { onMount, onDestroy } from 'svelte';
	import { AuctionTTTState } from '$lib/games/auction-ttt/state.svelte';
	import { Side, TurnPart } from '$lib/shared/auction-ttt/types';
	import X from '$lib/components/auction-ttt/X.svelte';
	import O from '$lib/components/auction-ttt/O.svelte';
	import { oppositeSideOf } from '$lib/shared/auction-ttt/utils';

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

	function beginNominate(row: number, col: number) {
		gameState.nominating = [row, col];
		gameState.currentBid = 0;
	}

	function cancelNominate() {
		gameState.nominating = null;
	}

	function nominate(row: number, col: number) {
		const bid = gameState.currentBid || 0;
		gameState.sendAction({ type: 'nominate', square: [row, col], startingBid: bid });
		gameState.nominating = null;
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

	function millisToMinutesAndSeconds(timeInMillis: number): string {
		const asDate = new Date(Date.UTC(0, 0, 0, 0, 0, 0, timeInMillis));
		return `${asDate.getUTCMinutes()}:${String(asDate.getUTCSeconds()).padStart(2, '0')}`;
	}
</script>

<svelte:head>
	<title>Auction Tic-Tac-Toe | {roomCode}</title>
</svelte:head>

{#if !gameState.connected}
	<div class="center-on-page">
		<p>Connecting to room {roomCode}...</p>
	</div>
{:else if !gameState.state}
	<div class="center-on-page">
		<p>Loading game state...</p>
	</div>
{:else}
	{@const state = gameState.state}

	<!-- Pregame -->
	{#if state.gameStage === 'pregame'}
		<h1>Damien's Arcade</h1>
		<div class="top-level-menu">
			<div>
				<h3>Room Settings</h3>
				<p>Room: {state.roomName} ({state.roomCode})</p>
				<p>You are: {state.pov === state.host ? 'Host' : 'Guest'}</p>
			</div>

			<div class="player-selection">
				<div class="player-slot">
					<X size={80} />
					{#if state.players.X.controller !== undefined}
						<p>Player joined</p>
						{#if gameState.mySide === Side.X}
							<button onclick={leave}>LEAVE</button>
						{/if}
					{:else}
						<button onclick={() => join(Side.X)}>JOIN AS X</button>
					{/if}
				</div>

				<div class="player-slot">
					<O size={80} />
					{#if state.players.O.controller !== undefined}
						<p>Player joined</p>
						{#if gameState.mySide === Side.O}
							<button onclick={leave}>LEAVE</button>
						{/if}
					{:else}
						<button onclick={() => join(Side.O)}>JOIN AS O</button>
					{/if}
				</div>
			</div>

			{#if state.pov === state.host && state.players.X.controller !== undefined && state.players.O.controller !== undefined}
				<button onclick={startGame}>START GAME</button>
			{/if}
		</div>

	<!-- Midgame -->
	{:else if state.gameStage === 'midgame'}
		{@const isNominatingPlayer = state.turnPart === TurnPart.Nominating && state.players[state.whoseTurnToNominate].controller === state.pov}
		{@const isBiddingPlayer = state.turnPart === TurnPart.Bidding && state.players[state.whoseTurnToBid].controller === state.pov}
		{@const xTurn = (state.whoseTurnToNominate === Side.X && state.turnPart === TurnPart.Nominating) || (state.whoseTurnToBid === Side.X && state.turnPart === TurnPart.Bidding)}
		{@const oTurn = (state.whoseTurnToNominate === Side.O && state.turnPart === TurnPart.Nominating) || (state.whoseTurnToBid === Side.O && state.turnPart === TurnPart.Bidding)}

		<div class="center-on-page">
			<div class="game-layout">
				<!-- Player X -->
				<div class="player-info">
					<X size={120} />
					<span class="money" class:this-players-turn={xTurn}>
						${state.players.X.money}
						{#if state.settings.useTiebreaker}
							· {millisToMinutesAndSeconds(state.players.X.timeUsed)}
						{/if}
					</span>
					{#if state.pov === state.players.X.controller}
						<span class="controller">(you)</span>
					{:else if state.players.X.controller === undefined && state.players[oppositeSideOf(Side.X)].controller !== state.pov}
						<button onclick={() => join(Side.X)}>REPLACE</button>
					{:else if state.players.X.controller === undefined}
						<span class="controller">(disconnected)</span>
					{/if}
				</div>

				<!-- Gameboard -->
				<div class="board-container">
					<div class="board">
						{#each state.squares as row, i}
							{#each row as cell, j}
								{@const isCurrentlyNominated =
									state.currentlyNominatedSquare !== null &&
									i === state.currentlyNominatedSquare[0] &&
									j === state.currentlyNominatedSquare[1]}
								{@const isNominating =
									gameState.nominating !== null &&
									i === gameState.nominating[0] &&
									j === gameState.nominating[1]}

								<div class="square">
									{#if cell === Side.X}
										<X size={100} />
									{:else if cell === Side.O}
										<O size={100} />
									{:else if isBiddingPlayer && isCurrentlyNominated}
										<div class="bidding-ui">
											<p>Bid:</p>
											<div class="form-field">
												<input
													type="number"
													min={state.lastBid! + 1}
													max={state.players[state.whoseTurnToBid].money}
													bind:value={gameState.currentBid}
												/>
												<input
													type="submit"
													value="BID"
													style="margin-top: 0;"
													onclick={bid}
												/>
											</div>
											<div class="form-field">
												<input type="submit" class="cancel" value="PASS" onclick={pass} />
											</div>
										</div>
									{:else if isNominating}
										<div class="bidding-ui">
											<p>Starting bid:</p>
											<div class="form-field">
												<input
													type="number"
													min={0}
													max={state.players[state.whoseTurnToNominate].money}
													bind:value={gameState.currentBid}
												/>
												<input
													type="submit"
													value="BID"
													style="margin-top: 0;"
													onclick={() => nominate(i, j)}
												/>
											</div>
											<div class="form-field">
												<input type="submit" class="cancel" value="CANCEL" onclick={cancelNominate} />
											</div>
										</div>
									{:else if isNominatingPlayer}
										<button class="nominate" onclick={() => beginNominate(i, j)}>
											Nominate
										</button>
									{:else if isCurrentlyNominated}
										<span class="last-bid">${state.lastBid}</span>
									{/if}
								</div>
							{/each}
						{/each}
					</div>
				</div>

				<!-- Player O -->
				<div class="player-info">
					<O size={120} />
					<span class="money" class:this-players-turn={oTurn}>
						${state.players.O.money}
						{#if state.settings.useTiebreaker}
							· {millisToMinutesAndSeconds(state.players.O.timeUsed)}
						{/if}
					</span>
					{#if state.pov === state.players.O.controller}
						<span class="controller">(you)</span>
					{:else if state.players.O.controller === undefined && state.players[oppositeSideOf(Side.O)].controller !== state.pov}
						<button onclick={() => join(Side.O)}>REPLACE</button>
					{:else if state.players.O.controller === undefined}
						<span class="controller">(disconnected)</span>
					{/if}
				</div>
			</div>

			<!-- Instruction -->
			<p class="instruction">
				{#if isNominatingPlayer && gameState.nominating === null}
					Click a square to put it up for auction.
				{:else if isNominatingPlayer && gameState.nominating !== null}
					Set your starting bid for this square.
				{:else if state.turnPart === TurnPart.Nominating}
					Waiting for {state.whoseTurnToNominate} to nominate a square.
				{:else if isBiddingPlayer}
					Make a bid on the square, or else pass.
				{:else if state.turnPart === TurnPart.Bidding}
					Waiting for {state.whoseTurnToBid} to bid.
				{:else}
					&nbsp;
				{/if}
			</p>
		</div>

	<!-- Postgame -->
	{:else}
		<div class="center-on-page">
			<div class="game-layout">
				<!-- Player X -->
				<div class="player-info">
					<X size={120} />
					<span class="money">${state.players.X.money}</span>
				</div>

				<!-- Gameboard -->
				<div class="board-container">
					<div class="board">
						{#each state.squares as row, i}
							{#each row as cell, j}
								<div class="square">
									{#if cell === Side.X}
										<X size={100} />
									{:else if cell === Side.O}
										<O size={100} />
									{/if}
								</div>
							{/each}
						{/each}

						{#if state.winner.winningSide !== Side.None}
							<svg viewBox="0 0 300 300" class="winner-line">
								<line
									x1={state.winner.start[1] === state.winner.end[1]
										? 50 + 100 * state.winner.start[1]
										: 10 + 140 * state.winner.start[1]}
									y1={state.winner.start[0] === state.winner.end[0]
										? 50 + 100 * state.winner.start[0]
										: 10 + 140 * state.winner.start[0]}
									x2={state.winner.start[1] === state.winner.end[1]
										? 50 + 100 * state.winner.end[1]
										: 10 + 140 * state.winner.end[1]}
									y2={state.winner.start[0] === state.winner.end[0]
										? 50 + 100 * state.winner.end[0]
										: 10 + 140 * state.winner.end[0]}
									stroke={state.winner.winningSide === Side.X ? '#d48' : '#3bd'}
									stroke-width={3}
								/>
							</svg>
						{/if}

						<div class="winner-name">
							{#if state.winner.winningSide === Side.None}
								<span style="border-color: var(--bg-5);">It's a draw.</span>
							{:else}
								<span>{state.winner.winningSide} wins!</span>
							{/if}
						</div>
					</div>

					{#if state.pov === state.host}
						<button onclick={rematch} style="margin-top: 2rem;">REMATCH</button>
					{/if}
				</div>

				<!-- Player O -->
				<div class="player-info">
					<O size={120} />
					<span class="money">${state.players.O.money}</span>
				</div>
			</div>
		</div>
	{/if}
{/if}

<style>
	.center-on-page {
		width: 100%;
		height: 100vh;
		display: flex;
		flex-flow: column;
		justify-content: center;
		align-items: center;
	}

	.game-layout {
		display: flex;
		flex-flow: row;
		width: 100%;
		justify-content: space-evenly;
		align-items: center;
	}

	.player-info {
		position: relative;
		display: flex;
		flex-flow: column;
		align-items: center;
	}

	.money {
		font-size: 1.5rem;
		margin-top: 1rem;
	}

	.this-players-turn {
		color: #ee6;
	}

	.controller {
		position: absolute;
		bottom: -1.5rem;
		color: var(--text-4);
	}

	.player-info button {
		position: absolute;
		bottom: -2rem;
	}

	.board-container {
		position: relative;
		display: flex;
		flex-flow: column;
		align-items: center;
	}

	.board {
		position: relative;
		display: grid;
		grid-template-rows: repeat(3, 9rem);
		grid-template-columns: repeat(3, 9rem);
		gap: 2px;
		background-color: var(--text-1);
	}

	.square {
		height: 100%;
		width: 100%;
		display: flex;
		flex-flow: column;
		justify-content: center;
		align-items: center;
		background-color: var(--bg-1);
	}

	.nominate {
		padding: 0;
		margin-top: 0;
		justify-self: unset;
		font-family: var(--font-main);
		height: 70%;
		width: 70%;
		border-radius: 0.75rem;
		color: #668;
		background-color: var(--bg-2);
		box-shadow:
			0.5rem 0.5rem 1rem var(--bg-2),
			0.5rem -0.5rem 1rem var(--bg-2),
			-0.5rem -0.5rem 1rem var(--bg-2),
			-0.5rem 0.5rem 1rem var(--bg-2);
		border: 0.5rem solid transparent;
		opacity: 0;
		transition: opacity 0.2s ease-in-out;
	}

	.nominate:hover {
		opacity: 100%;
		transition: opacity 0.1s ease-in-out;
	}

	.bidding-ui {
		display: flex;
		flex-flow: column;
		align-items: center;
	}

	.bidding-ui p {
		margin-top: 0;
		margin-bottom: 0.5rem;
	}

	.bidding-ui input[type='number'] {
		width: 2.5rem;
	}

	.cancel {
		margin-top: 0.5rem;
		flex: 1;
	}

	.last-bid {
		font-size: 2.5rem;
		font-weight: 200;
	}

	.winner-line {
		position: absolute;
		top: -1px;
		bottom: -1px;
		left: -1px;
		right: -1px;
		z-index: 1;
	}

	.winner-name {
		position: absolute;
		top: 0;
		bottom: 0;
		left: 0;
		right: 0;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.winner-name span {
		z-index: 2;
		padding: 0.5rem 0.5rem 0.3rem;
		font-size: 1.4rem;
		border: 2px solid var(--accent-1);
		border-radius: 8px;
		color: var(--text-2);
		background-color: var(--bg-3);
		opacity: 90%;
	}

	.instruction {
		margin-top: 1.75rem;
	}

	.player-selection {
		display: flex;
		flex-flow: row;
		gap: 2rem;
		margin: 2rem 0;
	}

	.player-slot {
		display: flex;
		flex-flow: column;
		align-items: center;
		padding: 1rem;
		border: 2px solid var(--text-3);
		border-radius: 0.5rem;
	}

	.top-level-menu {
		flex-flow: row;
		gap: 2rem;
	}
</style>
