<script lang="ts">
	import { goto } from '$app/navigation';
	import { Side } from '$lib/shared/auction-ttt/types';
	import type { Settings } from '$lib/shared/auction-ttt/types';

	let joinCode = $state('');
	let creating = $state(false);

	let settings = $state<Settings>({
		startingMoney: 100,
		startingPlayer: Side.None,
		useTiebreaker: false
	});

	async function createRoom() {
		creating = true;
		try {
			const response = await fetch('/api/rooms/create', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					gameType: 'auction-ttt',
					settings
				})
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

<div class="center-container">
	<h1>Auction Tic-Tac-Toe</h1>

	<div class="top-level-menu">
		<div class="menu-section">
			<h2>Create a Room</h2>

			<h3>Game Settings</h3>
			<form onsubmit={(e) => { e.preventDefault(); createRoom(); }}>
				<div class="form-field">
					<label for="startingMoney">Starting money:</label>
					<input
						type="number"
						id="startingMoney"
						min={0}
						bind:value={settings.startingMoney}
					/>
				</div>
				<div class="form-field">
					<label for="startingPlayer">Starting player:</label>
					<select id="startingPlayer" bind:value={settings.startingPlayer}>
						{#each Object.values(Side) as side}
							<option value={side}>{side === Side.None ? "Random" : side}</option>
						{/each}
					</select>
				</div>
				<div class="form-field">
					<label for="useTiebreaker">
						<input
							id="useTiebreaker"
							type="checkbox"
							bind:checked={settings.useTiebreaker}
						/>
						Use time as tiebreaker
					</label>
				</div>
				<button type="submit" disabled={creating}>
					{creating ? 'CREATING...' : 'CREATE ROOM'}
				</button>
			</form>
		</div>

		<div class="menu-section">
			<h2>Join a Room</h2>
			<form onsubmit={(e) => { e.preventDefault(); joinRoom(); }}>
				<div class="form-field">
					<label for="roomCode">Room code:</label>
					<input
						id="roomCode"
						type="text"
						bind:value={joinCode}
						placeholder="ABCD"
						style="text-transform: uppercase"
					/>
				</div>
				<button type="submit" disabled={!joinCode.trim()}>JOIN ROOM</button>
			</form>

			<h3 style="margin-top: 2rem;">How to Play</h3>
			<ol style="text-align: left; margin: 0; padding-left: 1.5rem;">
				<li>Two players compete to get three in a row</li>
				<li>On your turn, nominate a square and set a starting bid</li>
				<li>Your opponent can outbid you or pass</li>
				<li>Highest bidder gets the square and pays their bid</li>
				<li>Manage your money wisely to win!</li>
			</ol>
		</div>
	</div>

	<a href="/" class="back-link">← Back to Arcade</a>
</div>

<style>
	.center-container {
		width: 100%;
		min-height: 100vh;
		display: flex;
		flex-flow: column;
		align-items: center;
		padding: 2rem 0;
	}

	h1 {
		margin: 2rem 0;
	}

	.top-level-menu {
		margin: 1rem 3.5rem;
		padding: 1.25rem 2.25rem;
		border-radius: 1.5rem;
		display: flex;
		flex-flow: row;
		gap: 3rem;
	}

	.menu-section {
		flex: 1;
		display: flex;
		flex-flow: column;
		align-items: stretch;
	}

	h3 {
		margin-top: 1.5rem;
	}

	.back-link {
		margin-top: 2rem;
	}

	@media only screen and (max-width: 720px) {
		.top-level-menu {
			margin: 0.5rem 1rem;
			padding: 1rem;
			flex-flow: column;
		}
	}

	@media only screen and (min-width: 720px) and (max-width: 1200px) {
		.top-level-menu {
			margin: 0.75rem 1.5rem;
			padding: 1rem 1.25rem;
		}
	}
</style>
