<script lang="ts">
	import { goto } from '$app/navigation';

	let joinCode = $state('');
	let creating = $state(false);

	async function createRoom() {
		creating = true;
		try {
			const response = await fetch('/api/rooms/create', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ gameType: 'auction-ttt' })
			});

			const data = await response.json();
			goto(`/auction-ttt/game/${data.roomCode}`);
		} catch (err) {
			console.error('Failed to create room:', err);
			alert('Failed to create room');
			creating = false;
		}
	}

	function joinRoom() {
		if (joinCode.trim()) {
			goto(`/auction-ttt/game/${joinCode.toUpperCase()}`);
		}
	}
</script>

<svelte:head>
	<title>Auction Tic-Tac-Toe | Damien's Arcade</title>
</svelte:head>

<div class="landing">
	<header>
		<h1>Auction Tic-Tac-Toe</h1>
		<p>Bid on squares to claim them in this strategic twist on tic-tac-toe!</p>
	</header>

	<div class="actions">
		<section>
			<h2>Create a Room</h2>
			<button onclick={createRoom} disabled={creating}>
				{creating ? 'Creating...' : 'Create Room'}
			</button>
		</section>

		<section>
			<h2>Join a Room</h2>
			<input
				type="text"
				bind:value={joinCode}
				placeholder="Enter room code"
				style="text-transform: uppercase"
			/>
			<button onclick={joinRoom} disabled={!joinCode.trim()}>Join</button>
		</section>
	</div>

	<section class="how-to-play">
		<h2>How to Play</h2>
		<ol>
			<li>Two players compete to get three in a row</li>
			<li>On your turn, nominate a square and set a starting bid</li>
			<li>Your opponent can outbid you or pass</li>
			<li>Highest bidder gets the square and pays their bid</li>
			<li>Manage your money wisely to win!</li>
		</ol>
	</section>

	<a href="/">← Back to Arcade</a>
</div>

<style>
	.landing {
		max-width: 800px;
		margin: 0 auto;
		padding: 2rem;
	}

	header {
		text-align: center;
		margin-bottom: 3rem;
	}

	.actions {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 2rem;
		margin-bottom: 3rem;
	}

	section {
		padding: 2rem;
		border: 2px solid #333;
		border-radius: 8px;
	}

	input {
		width: 100%;
		padding: 0.5rem;
		margin-bottom: 1rem;
		font-size: 1rem;
	}

	button {
		width: 100%;
		padding: 1rem;
		font-size: 1rem;
		background: #4ecdc4;
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
	}

	button:hover:not(:disabled) {
		background: #45b8b0;
	}

	button:disabled {
		background: #ccc;
		cursor: not-allowed;
	}

	.how-to-play {
		text-align: left;
	}

	.how-to-play ol {
		line-height: 1.8;
	}

	a {
		display: inline-block;
		margin-top: 2rem;
		color: #333;
		text-decoration: none;
	}

	a:hover {
		text-decoration: underline;
	}
</style>
