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
				body: JSON.stringify({
					gameType: 'mayhem-manager'
				})
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const data = await response.json();

			if (!data.roomCode) {
				console.error('No roomCode in response:', data);
				throw new Error('Invalid response from server');
			}

			goto(`/mayhem-manager/${data.roomCode}`);
		} catch (err) {
			console.error('Failed to create room:', err);
			alert(`Failed to create room: ${err instanceof Error ? err.message : 'Unknown error'}`);
			creating = false;
		}
	}

	function joinRoom() {
		if (joinCode.trim()) {
			goto(`/mayhem-manager/${joinCode.toUpperCase()}`);
		}
	}
</script>

<svelte:head>
	<title>Mayhem Manager | Damien's Arcade</title>
</svelte:head>

<div class="center-container">
	<h1>Mayhem Manager</h1>

	<div class="top-level-menu">
		<div class="menu-section">
			<h2>Create a Room</h2>
			<form onsubmit={(e) => { e.preventDefault(); createRoom(); }}>
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
				<li>Build a team of fighters through draft and free agency</li>
				<li>Train your fighters and buy equipment</li>
				<li>Compete in tournaments and battle royales</li>
				<li>Manage your team's money and resources wisely</li>
				<li>Be the last team standing to win!</li>
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
